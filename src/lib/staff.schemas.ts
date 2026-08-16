import { z } from "zod";

export const performanceSchema = z.object({
  staffId: z.string().uuid(),
  reviewPeriod: z.enum(["monthly", "quarterly", "annual"]),
  rating: z.enum([
    "excellent",
    "good",
    "satisfactory",
    "needs-improvement",
    "unsatisfactory",
  ]),
  comments: z.string().max(2000).optional(),
});

export const scheduleSchema = z.object({
  staffId: z.string().uuid(),
  scheduleDate: z.string().min(8).max(20),
  startTime: z.string().min(4).max(8),
  endTime: z.string().min(4).max(8),
  scheduleType: z.enum(["regular", "overtime", "meeting", "training"]),
});

export const offerSchema = z.object({
  candidateName: z.string().min(2).max(120),
  candidateEmail: z.string().email(),
  position: z.string().min(2).max(120),
  salary: z.number().min(0).max(100000000),
  startDate: z.string().min(8).max(20),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const offerStatusSchema = z.object({
  offerId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const idSchema = z.object({ id: z.string().uuid() });
