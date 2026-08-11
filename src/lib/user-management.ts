import type { AccessLevel } from "@/lib/access";

export const PERMISSIONS = [
  { id: "user_manage", label: "Manage Users" },
  { id: "student_manage", label: "Manage Students" },
  { id: "staff_manage", label: "Manage Staff" },
  { id: "finance_view", label: "View Finance" },
  { id: "finance_edit", label: "Edit Finance" },
  { id: "reports_view", label: "View Reports" },
  { id: "reports_edit", label: "Edit Reports" },
  { id: "settings_manage", label: "Manage Settings" },
] as const;

export type PermissionId = (typeof PERMISSIONS)[number]["id"];

export const PERMISSION_IDS = PERMISSIONS.map((p) => p.id) as PermissionId[];

export const DEFAULT_PERMISSIONS: Record<AccessLevel, PermissionId[]> = {
  super_administrator: [...PERMISSION_IDS],
  administrator: [
    "user_manage",
    "student_manage",
    "staff_manage",
    "finance_view",
    "reports_view",
    "reports_edit",
  ],
  standard: ["student_manage", "reports_view"],
  basic: ["reports_view"],
};

export const ACCESS_DESCRIPTION: Record<AccessLevel, string> = {
  super_administrator:
    "Unrestricted control of the system: all modules, user management, security settings and configuration.",
  administrator:
    "Manage users, students, staff and reports across the school. Finance is read-only unless granted.",
  standard:
    "Day-to-day operational access to assigned modules and student records, with read-only reporting.",
  basic: "Personal access only: own records, results and notifications.",
};

export const GENDERS = ["Male", "Female", "Prefer not to say", "Other"];

export const DEPARTMENTS = [
  "Administration",
  "Academics",
  "Finance",
  "Library",
  "ICT",
  "Health",
  "Sports",
  "Maintenance",
  "Other",
];

export const CLASSES = [
  "Nursery 1",
  "Nursery 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

export const STATUSES = ["active", "suspended", "inactive"];

export function generateSecurePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
