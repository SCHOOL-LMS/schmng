import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  adminResetSchema,
  createAccountSchema,
  DEFAULT_LEVEL,
  resetRequestSchema,
  setupSchema,
} from "@/lib/admin.schemas";
import { assertAdmin, isSuperAdmin } from "@/lib/admin.server";

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
      .select("id, full_name, email, role, access_level, status, last_login, created_at")
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

    await supabaseAdmin.from("profiles").insert({
      id: user.user.id,
      full_name: data.fullName,
      email: data.email,
      role: data.role,
      access_level: (data.accessLevel ?? DEFAULT_LEVEL[data.role]) as "basic",
      status: "active",
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: user.user.id, role: data.role });
    return { id: user.user.id };
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
