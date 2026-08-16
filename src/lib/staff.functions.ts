import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, logAudit } from "@/lib/admin.server";
import {
  idSchema,
  offerSchema,
  offerStatusSchema,
  performanceSchema,
  scheduleSchema,
} from "@/lib/staff.schemas";
import { ratingScore } from "@/lib/staff";

const STAFF_COLUMNS =
  "id, full_name, email, phone, role, position, department, employee_id, salary, start_date, status, access_level, created_at";

/** Admin: everything the Staff Management module needs in one round trip. */
export const getStaffOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabase } = context;

    const [staff, performance, schedules, offers] = await Promise.all([
      supabase
        .from("profiles")
        .select(STAFF_COLUMNS)
        .in("role", ["staff", "school_manager", "super_admin"])
        .order("created_at", { ascending: false }),
      supabase.from("staff_performance").select("*").order("created_at", { ascending: false }),
      supabase.from("staff_schedules").select("*").order("schedule_date", { ascending: false }),
      supabase.from("offer_letters").select("*").order("created_at", { ascending: false }),
    ]);

    const first = staff.error ?? performance.error ?? schedules.error ?? offers.error;
    if (first) throw new Error(first.message);

    return {
      staff: staff.data ?? [],
      performance: performance.data ?? [],
      schedules: schedules.data ?? [],
      offers: offers.data ?? [],
    };
  });

export const createPerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => performanceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("staff_performance").insert({
      staff_id: data.staffId,
      review_period: data.reviewPeriod,
      rating: data.rating,
      rating_score: ratingScore(data.rating),
      comments: data.comments ?? "",
      reviewer_id: context.userId,
    });
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "performance_review_created",
      description: `Recorded a ${data.reviewPeriod} performance review (${data.rating})`,
      targetUserId: data.staffId,
    });
    return { ok: true };
  });

export const deletePerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("staff_performance")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => scheduleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.endTime <= data.startTime) {
      throw new Error("End time must be after the start time.");
    }
    const { error } = await context.supabase.from("staff_schedules").insert({
      staff_id: data.staffId,
      schedule_date: data.scheduleDate,
      start_time: data.startTime,
      end_time: data.endTime,
      schedule_type: data.scheduleType,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("staff_schedules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createOfferLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => offerSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("offer_letters").insert({
      candidate_name: data.candidateName,
      candidate_email: data.candidateEmail.trim().toLowerCase(),
      position: data.position,
      salary: data.salary,
      start_date: data.startDate,
      status: data.status,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "offer_letter_created",
      description: `Created an offer letter for ${data.candidateName} (${data.position})`,
      targetEmail: data.candidateEmail,
    });
    return { ok: true };
  });

export const setOfferStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => offerStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("offer_letters")
      .update({ status: data.status })
      .eq("id", data.offerId);
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "offer_letter_updated",
      description: `Offer letter marked ${data.status}`,
    });
    return { ok: true };
  });

export const deleteOfferLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("offer_letters").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
