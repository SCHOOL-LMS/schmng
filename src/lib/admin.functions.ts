import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const accountSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const roleEnum = z.enum(["super_admin", "school_manager", "staff", "student", "parent"]);
const levelEnum = z.enum(["super_administrator", "administrator", "standard", "basic"]);

const DEFAULT_LEVEL: Record<string, string> = {
  super_admin: "super_administrator",
  school_manager: "administrator",
  staff: "standard",
  student: "basic",
  parent: "basic",
};

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
  .inputValidator((d: unknown) =>
    z.object({ superAdmin: accountSchema, schoolManager: accountSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) > 0) {
      throw new Error("Setup has already been completed for this system.");
    }

    const created: string[] = [];
    for (const [role, account] of [
      ["super_admin", data.superAdmin],
      ["school_manager", data.schoolManager],
    ] as const) {
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
        access_level: DEFAULT_LEVEL[role] as "super_administrator" | "administrator",
        status: "active",
      });
      await supabaseAdmin.from("user_roles").insert({ user_id: user.user.id, role });
      created.push(account.email);
    }
    return { created };
  });

/** Public: raise a password reset request. Only an admin can actually reset it. */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), note: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("password_reset_requests").insert({
      email: data.email.toLowerCase(),
      note: data.note ?? null,
    });
    return { ok: true };
  });

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error || !data) throw new Error("Forbidden");
}

/** Admin: list all accounts. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, role, access_level, status, last_login, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin: create a user account (no self sign-up exists anywhere in the app). */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    accountSchema.extend({ role: roleEnum, accessLevel: levelEnum.optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const isSuper = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (data.role === "super_admin" && !isSuper.data) {
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
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("password_reset_requests")
      .update({ status: "completed", handled_by: context.userId, handled_at: new Date().toISOString() })
      .eq("status", "pending")
      .eq("email", (await supabaseAdmin.from("profiles").select("email").eq("id", data.userId).single()).data?.email ?? "");
    return { ok: true };
  });

/** Admin: pending password reset requests. */
export const listResetRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("password_reset_requests")
      .select("id, email, note, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
