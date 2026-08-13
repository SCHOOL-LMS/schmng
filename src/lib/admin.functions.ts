import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  adminResetSchema,
  bulkImportSchema,
  createAccountSchema,
  DEFAULT_LEVEL,
  deleteAccountSchema,
  resetRequestSchema,
  securitySettingsSchema,
  setupSchema,
  statusSchema,
  updateAccountSchema,
} from "@/lib/admin.schemas";
import {
  ACCOUNT_COLUMNS,
  assertAdmin,
  assertSuperAdmin,
  isSuperAdmin,
  logAudit,
} from "@/lib/admin.server";

/** Has the system already been initialised with a super admin? */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  const { count: managers } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "school_manager");
  return { initialised: (count ?? 0) > 0, hasManager: (managers ?? 0) > 0 };
});

/** One-time bootstrap: creates the initial Super Admin and School Manager accounts. */
export const runInitialSetup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => setupSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) > 0) throw new Error("Setup has already been completed for this system.");

    const created: string[] = [];
    const pairs = [
      ["super_admin", data.superAdmin],
      ["school_manager", data.schoolManager],
    ] as const;

    for (const [role, account] of pairs) {
      const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });
      if (error || !user.user) throw new Error(error?.message ?? "Could not create account");

      await supabaseAdmin.from("profiles").insert({
        id: user.user.id,
        full_name: account.fullName,
        email: account.email,
        role,
        access_level: DEFAULT_LEVEL[role] as "super_administrator",
        status: "active",
      });
      await supabaseAdmin.from("user_roles").insert({ user_id: user.user.id, role });
      created.push(account.email);
    }
    return { created };
  });

/** Public: raise a password reset request. Only an admin can actually reset the password. */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => resetRequestSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("password_reset_requests").insert({
      email: data.email.toLowerCase(),
      note: data.note ?? null,
    });
    return { ok: true };
  });

/** Admin: list all accounts. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("profiles")
      .select(ACCOUNT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin: create a user account. There is no self sign-up anywhere in the app. */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createAccountSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (
      (data.role === "super_admin" || data.role === "school_manager") &&
      !(await isSuperAdmin(context.supabase, context.userId))
    ) {
      throw new Error("Only a Super Admin can create administrator accounts.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !user.user) throw new Error(error?.message ?? "Could not create account");

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: user.user.id,
      full_name: data.fullName,
      email: data.email,
      username: data.username || null,
      role: data.role,
      access_level: (data.accessLevel ?? DEFAULT_LEVEL[data.role]) as "basic",
      status: "active",
      gender: data.gender || null,
      department: data.department || null,
      class_name: data.className || null,
      two_factor_enabled: data.twoFactorEnabled ?? false,
      permissions: data.permissions ?? [],
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.user.id);
      throw new Error(profileError.message);
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: user.user.id, role: data.role });

    await logAudit(context.supabase, context.userId, {
      action: "user_created",
      description: `Created account for ${data.email} (${data.role})`,
      targetUserId: user.user.id,
      targetEmail: data.email,
    });
    return { id: user.user.id };
  });

/** Admin: update an existing account. */
export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateAccountSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.role === "super_admin" || data.role === "school_manager") {
      await assertSuperAdmin(context.supabase, context.userId);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        email: data.email,
        username: data.username || null,
        role: data.role,
        access_level: data.accessLevel,
        status: data.status,
        gender: data.gender || null,
        department: data.department || null,
        class_name: data.className || null,
        two_factor_enabled: data.twoFactorEnabled ?? false,
        permissions: data.permissions ?? [],
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: data.email });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });

    await logAudit(context.supabase, context.userId, {
      action: "user_updated",
      description: `Updated account ${data.email}`,
      targetUserId: data.userId,
      targetEmail: data.email,
    });
    return { ok: true };
  });

/** Admin: activate or suspend an account. */
export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await logAudit(context.supabase, context.userId, {
      action: "status_changed",
      description: `Account status set to ${data.status}`,
      targetUserId: data.userId,
    });
    return { ok: true };
  });

/** Super Admin: permanently delete an account. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteAccountSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await logAudit(context.supabase, context.userId, {
      action: "user_deleted",
      description: `Deleted account ${target?.email ?? data.userId}`,
      targetEmail: target?.email ?? null,
    });
    return { ok: true };
  });

/** Admin: bulk import accounts from CSV rows. */
export const bulkImportAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkImportSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const superAdmin = await isSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let created = 0;
    const failed: string[] = [];
    for (const row of data.users) {
      if (!superAdmin && (row.role === "super_admin" || row.role === "school_manager")) {
        failed.push(`${row.email}: only a Super Admin can create administrator accounts`);
        continue;
      }
      const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
        email: row.email,
        password: row.password,
        email_confirm: true,
        user_metadata: { full_name: row.fullName },
      });
      if (error || !user.user) {
        failed.push(`${row.email}: ${error?.message ?? "could not be created"}`);
        continue;
      }
      await supabaseAdmin.from("profiles").insert({
        id: user.user.id,
        full_name: row.fullName,
        email: row.email,
        username: row.username || null,
        role: row.role,
        access_level: DEFAULT_LEVEL[row.role] as "basic",
        status: "active",
        department: row.department || null,
        class_name: row.className || null,
      });
      await supabaseAdmin.from("user_roles").insert({ user_id: user.user.id, role: row.role });
      created += 1;
    }

    await logAudit(context.supabase, context.userId, {
      action: "bulk_import",
      description: `Bulk import: ${created} created, ${failed.length} failed`,
    });
    return { created, failed };
  });

/** Admin: reset another user's password. Users can never reset their own. */
export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adminResetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .update({ force_password_change: true, password_reset_at: new Date().toISOString() })
      .eq("id", data.userId);

    const target = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    if (target.data?.email) {
      await supabaseAdmin
        .from("password_reset_requests")
        .update({
          status: "completed",
          handled_by: context.userId,
          handled_at: new Date().toISOString(),
        })
        .eq("status", "pending")
        .eq("email", target.data.email.toLowerCase());
    }

    await logAudit(context.supabase, context.userId, {
      action: "password_reset",
      description: `Password reset for ${target.data?.email ?? data.userId}`,
      targetUserId: data.userId,
      targetEmail: target.data?.email ?? null,
    });
    return { ok: true };
  });

/** Admin: recent password reset requests. */
export const listResetRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("password_reset_requests")
      .select("id, email, note, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin: audit log feed. */
export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("id, action, description, actor_id, target_email, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Super Admin: clear the audit trail. */
export const clearAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("audit_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "audit_cleared",
      description: "Audit logs cleared",
    });
    return { ok: true };
  });

/** Admin: read system security settings. */
export const getSecuritySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("security_settings")
      .select(
        "id, allowed_ips, max_login_attempts, lockout_duration, session_timeout, max_concurrent_sessions, updated_at",
      )
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/** Super Admin: save system security settings. */
export const saveSecuritySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => securitySettingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("security_settings")
      .update({
        allowed_ips: data.allowedIps,
        max_login_attempts: data.maxLoginAttempts,
        lockout_duration: data.lockoutDuration,
        session_timeout: data.sessionTimeout,
        max_concurrent_sessions: data.maxConcurrentSessions,
      })
      .eq("singleton", true);
    if (error) throw new Error(error.message);

    await logAudit(context.supabase, context.userId, {
      action: "security_settings_saved",
      description: "Security settings updated",
      details: { ...data },
    });
    return { ok: true };
  });

/** Super Admin: force every non-admin user to change their password on next reset. */
export const forcePasswordChangeAll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin
      .from("profiles")
      .update({ force_password_change: true }, { count: "exact" })
      .neq("id", context.userId);
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "force_password_change",
      description: `Forced password change for ${count ?? 0} accounts`,
    });
    return { affected: count ?? 0 };
  });

/** Super Admin: suspend every account except your own. */
export const lockAllAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin
      .from("profiles")
      .update({ status: "suspended" }, { count: "exact" })
      .neq("id", context.userId);
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "lock_all_accounts",
      description: `Suspended ${count ?? 0} accounts`,
    });
    return { affected: count ?? 0 };
  });

/** Any signed-in user: stamp last login and record the event in the audit trail. */
export const recordLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .update({ last_login: now })
      .eq("id", context.userId)
      .select("email, role")
      .maybeSingle();

    await supabaseAdmin.from("audit_logs").insert({
      action: "login",
      description: `${profile?.email ?? context.userId} signed in as ${profile?.role ?? "user"}`,
      actor_id: context.userId,
      actor_email: profile?.email ?? null,
      target_user_id: context.userId,
      target_email: profile?.email ?? null,
    });
    return { ok: true };
  });
