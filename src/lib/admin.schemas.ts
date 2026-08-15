import { z } from "zod";

export const accountSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const roleEnum = z.enum(["super_admin", "school_manager", "staff", "student", "parent"]);
export const levelEnum = z.enum([
  "super_administrator",
  "administrator",
  "standard",
  "basic",
]);

export const permissionEnum = z.enum([
  "user_manage",
  "student_manage",
  "staff_manage",
  "finance_view",
  "finance_edit",
  "reports_view",
  "reports_edit",
  "settings_manage",
]);

const profileExtras = {
  username: z.string().min(3).max(60).optional().nullable(),
  gender: z.string().max(60).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  className: z.string().max(60).optional().nullable(),
  twoFactorEnabled: z.boolean().optional(),
  permissions: z.array(permissionEnum).optional(),
};

export const setupSchema = z.object({
  superAdmin: accountSchema,
  schoolManager: accountSchema,
});

export const createAccountSchema = accountSchema.extend({
  role: roleEnum,
  accessLevel: levelEnum.optional(),
  ...profileExtras,
});

export const updateAccountSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  role: roleEnum,
  accessLevel: levelEnum,
  status: z.enum(["active", "suspended", "inactive"]),
  ...profileExtras,
});

export const statusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "suspended", "inactive"]),
});

export const deleteAccountSchema = z.object({ userId: z.string().uuid() });

export const resetRequestSchema = z.object({
  email: z.string().email(),
  note: z.string().max(500).optional(),
});

export const adminResetSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).max(200),
});

export const resolveResetRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    action: z.enum(["approve", "reject"]),
    password: z.string().min(8).max(200).optional(),
  })
  .refine((v) => v.action !== "approve" || !!v.password, {
    message: "A new password is required to approve a reset request.",
    path: ["password"],
  });

export const resetRequestIdSchema = z.object({ requestId: z.string().uuid() });


export const bulkImportSchema = z.object({
  users: z
    .array(
      z.object({
        fullName: z.string().min(2).max(120),
        email: z.string().email(),
        role: roleEnum,
        password: z.string().min(8).max(200),
        username: z.string().max(60).optional(),
        department: z.string().max(120).optional(),
        className: z.string().max(60).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export const securitySettingsSchema = z.object({
  allowedIps: z.string().max(4000),
  maxLoginAttempts: z.number().int().min(1).max(10),
  lockoutDuration: z.number().int().min(5).max(1440),
  sessionTimeout: z.number().int().min(5).max(480),
  maxConcurrentSessions: z.number().int().min(1).max(10),
});

export const DEFAULT_LEVEL: Record<string, string> = {
  super_admin: "super_administrator",
  school_manager: "administrator",
  staff: "standard",
  student: "basic",
  parent: "basic",
};

export const changeOwnPasswordSchema = z.object({
  password: z.string().min(8).max(200),
});
