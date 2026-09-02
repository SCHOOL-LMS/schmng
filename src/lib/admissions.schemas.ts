import { z } from "zod";

const optionalText = z.string().max(300).optional().nullable();

export const admissionInputSchema = z.object({
  studentName: z.string().min(2).max(150),
  dob: z.string().max(20).optional().nullable(),
  placeOfBirth: optionalText,
  classAdmitted: z.string().min(1).max(60),
  previousSchool: optionalText,
  previousClass: optionalText,
  lastAttendance: z.string().max(20).optional().nullable(),
  reasonForLeaving: optionalText,
  disabilityStatus: z.string().max(40).default("No"),
  disabilityType: optionalText,
  assistanceNeeded: optionalText,
  gender: z.string().max(40).default("Other"),
  parentName: z.string().min(2).max(150),
  relationship: optionalText,
  parentPhone: optionalText,
  altContact: optionalText,
  hometown: optionalText,
  hometownDistrict: optionalText,
  residence: optionalText,
  residenceDistrict: optionalText,
  /** Mandatory: it is the parent login and half of the student login. */
  parentEmail: z.string().email().max(200),
  emergencyName: optionalText,
  emergencyPhone: optionalText,
  emergencyRelationship: optionalText,
  emergencyResidence: optionalText,
  emergencyResidenceDistrict: optionalText,
  address: optionalText,
  city: optionalText,
  community: optionalText,
  digitalAddress: optionalText,
});

export const createAdmissionSchema = admissionInputSchema;

export const updateAdmissionSchema = admissionInputSchema.extend({
  id: z.string().uuid(),
  status: z.enum(["admitted", "pending", "withdrawn"]).optional(),
});

export const admissionIdSchema = z.object({ id: z.string().uuid() });

export const studentLoginSchema = z.object({
  parentEmail: z.string().email().max(200),
  admissionNumber: z.string().min(4).max(60),
});

export const classTeacherSchema = z.object({
  className: z.string().min(1).max(60),
  teacherName: z.string().max(150).default(""),
  teacherEmail: z.string().max(200).default(""),
  teacherPhone: z.string().max(60).default(""),
});

export const exeatSchema = z.object({
  admissionId: z.string().uuid(),
  status: z.enum(["in_school", "out"]),
  reason: z.string().max(300).default(""),
  destination: z.string().max(200).default(""),
  returnAt: z.string().max(40).optional().nullable(),
});
