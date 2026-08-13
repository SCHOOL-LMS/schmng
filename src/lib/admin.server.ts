import type { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_ROLES = new Set(["super_admin", "school_manager"]);

/**
 * Reads the caller's roles. The role-check helpers live in a private schema and
 * are not exposed through the API, so we read the role rows directly (the
 * caller can always read their own roles under RLS) and fall back to the
 * profile role. Super Admin is never restricted anywhere in the app.
 */
export async function getRoles(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const roles = new Set<string>();

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  for (const row of roleRows ?? []) {
    if (row?.role) roles.add(row.role as string);
  }

  if (roles.size === 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role) roles.add(profile.role as string);
  }

  return [...roles];
}

export async function isSuperAdmin(supabase: SupabaseClient, userId: string) {
  return (await getRoles(supabase, userId)).includes("super_admin");
}

export async function isAdmin(supabase: SupabaseClient, userId: string) {
  return (await getRoles(supabase, userId)).some((r) => ADMIN_ROLES.has(r));
}

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  if (!(await isAdmin(supabase, userId))) {
    throw new Error("Forbidden: administrator access required.");
  }
}

export async function assertSuperAdmin(supabase: SupabaseClient, userId: string) {
  if (!(await isSuperAdmin(supabase, userId))) {
    throw new Error("Forbidden: Super Admin access required.");
  }
}

export async function logAudit(
  supabase: SupabaseClient,
  actorId: string,
  entry: {
    action: string;
    description: string;
    targetUserId?: string | null;
    targetEmail?: string | null;
    details?: Record<string, unknown>;
  },
) {
  await supabase.from("audit_logs").insert({
    action: entry.action,
    description: entry.description,
    actor_id: actorId,
    target_user_id: entry.targetUserId ?? null,
    target_email: entry.targetEmail ?? null,
    details: entry.details ?? {},
  });
}

export const ACCOUNT_COLUMNS =
  "id, full_name, email, username, role, access_level, status, gender, department, class_name, two_factor_enabled, permissions, force_password_change, last_login, created_at";
