/* ------------------------------------------------------------------ *
 * System Configuration: shared constants, types and formatting helpers
 * for the multi-tenant catalogue (schools, education levels, school
 * types, subjects), per-tenant policy and per-school branding.
 *
 * Browser-safe: no server imports, so both the module UI and any future
 * tenant shell can consume the same helpers.
 * ------------------------------------------------------------------ */

import type { CSSProperties } from "react";
import { MODULES } from "@/lib/access";

export interface SchoolType {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface EducationLevel {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  min_age: number | null;
  max_age: number | null;
  active: boolean;
}

export interface School {
  id: string;
  name: string;
  code: string;
  country: string;
  region: string;
  timezone: string;
  currency: string;
  locale: string;
  type_code: string;
  level_codes: string[];
  active: boolean;
}

export interface Subject {
  id: string;
  school_id: string | null;
  level_code: string;
  code: string;
  name: string;
  credits: number | null;
  elective: boolean;
  active: boolean;
}

export interface RatingScaleItem {
  value: string;
  label: string;
}

export interface TenantSettings {
  id: string;
  school_id: string;
  positions: string[];
  departments: string[];
  rating_scale: RatingScaleItem[];
  schedule_types: string[];
  grading_system: "letter" | "percentage" | "gpa" | "points";
  academic_year_start_month: number;
  week_starts_on: "monday" | "sunday";
  features: Record<string, boolean>;
}

export interface SchoolBranding {
  id: string;
  school_id: string;
  display_name: string;
  tagline: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  language: string;
  currency: string;
  locale: string;
  date_format: "dmy" | "mdy" | "ymd";
  show_powered_by: boolean;
}

export const LANGUAGES: { code: string; name: string; rtl?: boolean }[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
  { code: "es", name: "Español" },
  { code: "sw", name: "Kiswahili" },
  { code: "ha", name: "Hausa" },
  { code: "ar", name: "العربية", rtl: true },
  { code: "am", name: "አማርኛ" },
  { code: "zh", name: "中文" },
  { code: "hi", name: "हिन्दी" },
];

export const CURRENCIES = [
  "GHS", "NGN", "KES", "ZAR", "TZS", "UGX", "XOF", "XAF", "EGP", "MAD", "ETB", "RWF",
  "USD", "EUR", "GBP", "CAD", "AUD", "INR", "CNY", "AED", "SAR", "BRL",
];

export const GRADING_SYSTEMS = ["letter", "percentage", "gpa", "points"] as const;
export const DATE_FORMATS = ["dmy", "mdy", "ymd"] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Every module ships enabled unless a tenant turns it off. */
export function defaultModuleFeatures(): Record<string, boolean> {
  return Object.fromEntries(MODULES.map((m) => [m.id, true]));
}

/** Merge in modules released after a school was provisioned. */
export function mergedFeatures(features: Record<string, boolean> | null | undefined) {
  return { ...defaultModuleFeatures(), ...(features ?? {}) };
}

export const DEFAULT_POSITIONS = [
  "Teacher", "Administrator", "Support Staff", "Manager", "Counsellor", "Librarian",
];
export const DEFAULT_DEPARTMENTS = [
  "Academic", "Administration", "IT Support", "Maintenance", "Finance", "Student Affairs",
];
export const DEFAULT_SCHEDULE_TYPES = [
  "Regular Class", "Duty / Supervision", "Meeting", "Training", "Examination", "Overtime",
];
export const DEFAULT_RATING_SCALE: RatingScaleItem[] = [
  { value: "5", label: "Excellent" },
  { value: "4", label: "Very Good" },
  { value: "3", label: "Good" },
  { value: "2", label: "Needs Improvement" },
  { value: "1", label: "Unsatisfactory" },
];

/* ----------------------------- theming ----------------------------- */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1] ?? "0", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance → pick a readable foreground. */
export function readableForeground(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "oklch(0.99 0.005 200)";
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = [lin(rgb[0]!), lin(rgb[1]!), lin(rgb[2]!)];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? "oklch(0.2 0.03 240)" : "oklch(0.99 0.005 200)";
}

/** Scoped design tokens — apply to a tenant wrapper, never to :root. */
export function brandingStyle(b: Pick<SchoolBranding, "primary_color" | "accent_color">): CSSProperties {
  const p = b.primary_color || "#2f6f8f";
  const a = b.accent_color || "#d9a441";
  return {
    "--primary": p,
    "--primary-foreground": readableForeground(p),
    "--accent": a,
    "--accent-foreground": readableForeground(a),
    "--ring": p,
  } as CSSProperties;
}

export const isRtl = (language: string) =>
  LANGUAGES.find((l) => l.code === language)?.rtl === true;

export function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatBrandDate(
  date: Date,
  b: Pick<SchoolBranding, "locale" | "date_format">,
) {
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
  try {
    const parts = new Intl.DateTimeFormat(b.locale, opts).formatToParts(date);
    const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
    const d = get("day"), m = get("month"), y = get("year");
    return b.date_format === "mdy" ? `${m}/${d}/${y}` : b.date_format === "ymd" ? `${y}-${m}-${d}` : `${d}/${m}/${y}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Comma-separated text field ⇄ string list. */
export const splitList = (value: string) =>
  value.split(",").map((v) => v.trim()).filter(Boolean);
export const joinList = (values: string[] | null | undefined) => (values ?? []).join(", ");
