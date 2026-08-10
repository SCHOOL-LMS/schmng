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

export const setupSchema = z.object({
  superAdmin: accountSchema,
  schoolManager: accountSchema,
});

export const createAccountSchema = accountSchema.extend({
  role: roleEnum,
  accessLevel: levelEnum.optional(),
});

export const resetRequestSchema = z.object({
  email: z.string().email(),
  note: z.string().max(500).optional(),
});

export const adminResetSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).max(200),
});

export const DEFAULT_LEVEL: Record<string, string> = {
  super_admin: "super_administrator",
  school_manager: "administrator",
  staff: "standard",
  student: "basic",
  parent: "basic",
};
