import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  UserPlus,
  CalendarCheck,
  Receipt,
  GraduationCap,
  FileQuestion,
  CalendarClock,
  Library,
  Users,
  MessagesSquare,
  ClipboardList,
  FileText,
  BookOpenCheck,
  ClipboardCheck,
  HeartHandshake,
  TrendingUp,
  Wallet,
  BarChart3,
  ShieldCheck,
  UserCog,
  Archive,
  Settings2,
} from "lucide-react";

export type Role = "super_admin" | "school_manager" | "staff" | "student" | "parent";

export type AccessLevel = "super_administrator" | "administrator" | "standard" | "basic";

export const ROLES: Role[] = ["super_admin", "school_manager", "staff", "student", "parent"];

export const ACCESS_RANK: Record<AccessLevel, number> = {
  basic: 1,
  standard: 2,
  administrator: 3,
  super_administrator: 4,
};

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  super_administrator: "Super Administrator Access",
  administrator: "Administrator Access",
  standard: "Standard Access",
  basic: "Basic Access",
};

export interface RoleMeta {
  id: Role;
  label: string;
  tagline: string;
  accessLevel: AccessLevel;
  accent: string; // semantic token name suffix
}

export const ROLE_META: Record<Role, RoleMeta> = {
  super_admin: {
    id: "super_admin",
    label: "Super Admin",
    tagline: "System-wide control and configuration",
    accessLevel: "super_administrator",
    accent: "role-super",
  },
  school_manager: {
    id: "school_manager",
    label: "School Manager",
    tagline: "Registrar & Finance operations",
    accessLevel: "administrator",
    accent: "role-manager",
  },
  staff: {
    id: "staff",
    label: "Staff",
    tagline: "Teaching, Library, and General Staff",
    accessLevel: "standard",
    accent: "role-staff",
  },
  student: {
    id: "student",
    label: "Student",
    tagline: "Access to academics and personal records",
    accessLevel: "basic",
    accent: "role-student",
  },
  parent: {
    id: "parent",
    label: "Parent",
    tagline: "Monitor child's academic progress",
    accessLevel: "basic",
    accent: "role-parent",
  },
};

export type ModuleCategory = "Academics" | "Operations" | "People" | "Finance" | "Administration";

export interface ModuleDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ModuleCategory;
  roles: Role[];
}

const ALL: Role[] = ["super_admin", "school_manager", "staff", "student", "parent"];
const ADMINS: Role[] = ["super_admin", "school_manager"];
const STAFF_UP: Role[] = ["super_admin", "school_manager", "staff"];

export const MODULES: ModuleDef[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Overview of activity, alerts and quick actions.",
    icon: LayoutDashboard,
    category: "Operations",
    roles: ALL,
  },
  {
    id: "admissions",
    name: "Admissions",
    description: "Applications, enrolment pipeline and placement.",
    icon: UserPlus,
    category: "Operations",
    roles: ADMINS,
  },
  {
    id: "attendance",
    name: "Attendance",
    description: "Daily registers, absence tracking and reports.",
    icon: CalendarCheck,
    category: "Academics",
    roles: ["super_admin", "school_manager", "staff", "student"],
  },
  {
    id: "students",
    name: "Students",
    description: "Student records, classes and guardians.",
    icon: GraduationCap,
    category: "People",
    roles: STAFF_UP,
  },
  {
    id: "staff-management",
    name: "Staff Management",
    description: "Onboarding, roles and staff records.",
    icon: Users,
    category: "People",
    roles: ADMINS,
  },
  {
    id: "exams-quizzes",
    name: "Exams & Quizzes",
    description: "Question banks, scheduling and marking.",
    icon: FileQuestion,
    category: "Academics",
    roles: ["super_admin", "school_manager", "staff", "student"],
  },
  {
    id: "assessment",
    name: "Assessment",
    description: "Continuous assessment entry and moderation.",
    icon: ClipboardCheck,
    category: "Academics",
    roles: STAFF_UP,
  },
  {
    id: "results",
    name: "Results",
    description: "Grades, broadsheets and result publication.",
    icon: ClipboardList,
    category: "Academics",
    roles: ALL,
  },
  {
    id: "termly-reports",
    name: "Termly Reports",
    description: "End-of-term report cards and comments.",
    icon: BookOpenCheck,
    category: "Academics",
    roles: STAFF_UP,
  },
  {
    id: "timetable",
    name: "Timetable",
    description: "Class, teacher and exam scheduling.",
    icon: CalendarClock,
    category: "Academics",
    roles: ["super_admin", "school_manager", "staff", "student"],
  },
  {
    id: "library",
    name: "Library",
    description: "Catalogue, lending and returns.",
    icon: Library,
    category: "Operations",
    roles: ["super_admin", "school_manager", "staff", "student"],
  },
  {
    id: "messaging",
    name: "Messaging",
    description: "Internal announcements and direct messages.",
    icon: MessagesSquare,
    category: "Operations",
    roles: ALL,
  },
  {
    id: "parent-communication",
    name: "Parent Communication",
    description: "Circulars, meetings and guardian updates.",
    icon: HeartHandshake,
    category: "People",
    roles: ["super_admin", "school_manager", "staff", "parent"],
  },
  {
    id: "performance-tracker",
    name: "Performance Tracker",
    description: "Progress trends across terms and subjects.",
    icon: TrendingUp,
    category: "Academics",
    roles: ALL,
  },
  {
    id: "fees-invoicing",
    name: "Fees & Invoicing",
    description: "Fee structures, billing runs and balances.",
    icon: Receipt,
    category: "Finance",
    roles: ADMINS,
  },
  {
    id: "invoices",
    name: "Invoices",
    description: "Issued invoices, receipts and payment status.",
    icon: FileText,
    category: "Finance",
    roles: ADMINS,
  },
  {
    id: "financial-management",
    name: "Financial Management",
    description: "Budgets, expenses and financial reporting.",
    icon: Wallet,
    category: "Finance",
    roles: ADMINS,
  },
  {
    id: "advanced-reporting",
    name: "Advanced Reporting",
    description: "Cross-module analytics and exports.",
    icon: BarChart3,
    category: "Administration",
    roles: ["super_admin"],
  },
  {
    id: "user-verification",
    name: "User Verification",
    description: "Identity checks and account approvals.",
    icon: ShieldCheck,
    category: "Administration",
    roles: ["super_admin"],
  },
  {
    id: "user-management",
    name: "User Management",
    description: "Accounts, access levels and password resets.",
    icon: UserCog,
    category: "Administration",
    roles: ["super_admin"],
  },
  {
    id: "archives",
    name: "Archives",
    description: "Historical records and retention.",
    icon: Archive,
    category: "Administration",
    roles: ["super_admin"],
  },
  {
    id: "system-configuration",
    name: "System Configuration",
    description: "School settings, terms, sessions and branding.",
    icon: Settings2,
    category: "Administration",
    roles: ["super_admin"],
  },
];

export function modulesForRole(role: Role): ModuleDef[] {
  return MODULES.filter((m) => m.roles.includes(role));
}

export function getModule(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}

export function canAccess(role: Role, moduleId: string): boolean {
  const mod = getModule(moduleId);
  return !!mod && mod.roles.includes(role);
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  "Operations",
  "Academics",
  "People",
  "Finance",
  "Administration",
];
