import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Forbidden: administrator access required.");
}

export async function isSuperAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  return Boolean(data);
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
