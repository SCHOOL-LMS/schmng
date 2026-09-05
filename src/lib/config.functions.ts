import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSuperAdmin, logAudit } from "@/lib/admin.server";
import {
  brandingSchema,
  educationLevelSchema,
  idSchema,
  schoolSchema,
  schoolTypeSchema,
  subjectSchema,
  tenantSettingsSchema,
  updateSchoolSchema,
} from "@/lib/config.schemas";
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_POSITIONS,
  DEFAULT_RATING_SCALE,
  DEFAULT_SCHEDULE_TYPES,
  defaultModuleFeatures,
  mergedFeatures,
} from "@/lib/config";

/** Everything the System Configuration module needs, in one round trip. */
export const getConfiguration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabase } = context;

    const [types, levels, schools, subjects, settings, branding] = await Promise.all([
      supabase.from("school_types").select("*").order("name"),
      supabase.from("education_levels").select("*").order("sort_order"),
      supabase.from("schools").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("tenant_settings").select("*"),
      supabase.from("school_branding").select("*"),
    ]);

    const failure =
      types.error ?? levels.error ?? schools.error ?? subjects.error ?? settings.error ?? branding.error;
    if (failure) throw new Error(failure.message);

    return {
      types: types.data ?? [],
      levels: levels.data ?? [],
      schools: schools.data ?? [],
      subjects: subjects.data ?? [],
      settings: (settings.data ?? []).map((s) => ({ ...s, features: mergedFeatures(s.features as never) })),
      branding: branding.data ?? [],
    };
  });

/* ----------------------------- schools ----------------------------- */

export const createSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schoolSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabase } = context;

    const { data: type } = await supabase
      .from("school_types")
      .select("code")
      .eq("code", data.typeCode)
      .maybeSingle();
    if (!type) throw new Error("Unknown school type.");

    const { data: levels } = await supabase
      .from("education_levels")
      .select("code")
      .in("code", data.levelCodes);
    if ((levels?.length ?? 0) !== data.levelCodes.length) {
      throw new Error("One or more education levels no longer exist.");
    }

    const { data: school, error } = await supabase
      .from("schools")
      .insert({
        name: data.name,
        code: data.code,
        country: data.country,
        region: data.region ?? "",
        timezone: data.timezone ?? "UTC",
        currency: data.currency,
        locale: data.locale,
        type_code: data.typeCode,
        level_codes: data.levelCodes,
        active: data.active ?? true,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(
        error.code === "23505" ? "A school already uses that short code." : error.message,
      );
    }

    // Provision the tenant's policy + branding rows atomically with the school
    // so no downstream module ever reads a half-configured tenant.
    const [{ error: sErr }, { error: bErr }] = await Promise.all([
      supabase.from("tenant_settings").insert({
        school_id: school.id,
        positions: DEFAULT_POSITIONS,
        departments: DEFAULT_DEPARTMENTS,
        schedule_types: DEFAULT_SCHEDULE_TYPES,
        rating_scale: DEFAULT_RATING_SCALE,
        features: defaultModuleFeatures(),
      }),
      supabase.from("school_branding").insert({
        school_id: school.id,
        display_name: school.name,
        currency: school.currency,
        locale: school.locale,
      }),
    ]);
    if (sErr ?? bErr) throw new Error((sErr ?? bErr)!.message);

    await logAudit(supabase, context.userId, {
      action: "school_created",
      description: `Provisioned school ${school.name} (${school.code})`,
      details: { schoolId: school.id },
    });
    return school;
  });

export const updateSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchoolSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { id, typeCode, levelCodes, ...rest } = data;
    const { error } = await context.supabase
      .from("schools")
      .update({
        ...(rest.name !== undefined ? { name: rest.name } : {}),
        ...(rest.code !== undefined ? { code: rest.code } : {}),
        ...(rest.country !== undefined ? { country: rest.country } : {}),
        ...(rest.region !== undefined ? { region: rest.region } : {}),
        ...(rest.timezone !== undefined ? { timezone: rest.timezone } : {}),
        ...(rest.currency !== undefined ? { currency: rest.currency } : {}),
        ...(rest.locale !== undefined ? { locale: rest.locale } : {}),
        ...(rest.active !== undefined ? { active: rest.active } : {}),
        ...(typeCode !== undefined ? { type_code: typeCode } : {}),
        ...(levelCodes !== undefined ? { level_codes: levelCodes } : {}),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "school_updated",
      description: `Updated school configuration`,
      details: { schoolId: id },
    });
    return { ok: true };
  });

export const deleteSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("schools").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "school_deleted",
      description: "Removed a school and its scoped configuration",
      details: { schoolId: data.id },
    });
    return { ok: true };
  });

/* -------------------------- catalogue -------------------------- */

export const createEducationLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => educationLevelSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("education_levels").insert({
      code: data.code,
      name: data.name,
      sort_order: data.sortOrder,
      min_age: data.minAge ?? null,
      max_age: data.maxAge ?? null,
      active: data.active ?? true,
    });
    if (error) {
      throw new Error(error.code === "23505" ? "That level code already exists." : error.message);
    }
    return { ok: true };
  });

export const createSchoolType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schoolTypeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("school_types").insert({
      code: data.code,
      name: data.name,
      description: data.description ?? "",
      active: data.active ?? true,
    });
    if (error) {
      throw new Error(error.code === "23505" ? "That type code already exists." : error.message);
    }
    return { ok: true };
  });

export const createSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => subjectSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabase } = context;

    const { data: school } = await supabase
      .from("schools")
      .select("id, level_codes")
      .eq("id", data.schoolId)
      .maybeSingle();
    if (!school) throw new Error("Unknown school.");
    if (!(school.level_codes ?? []).includes(data.levelCode)) {
      throw new Error("That education level is not offered by this school.");
    }

    const { error } = await supabase.from("subjects").insert({
      school_id: data.schoolId,
      level_code: data.levelCode,
      code: data.code,
      name: data.name,
      credits: data.credits ?? null,
      elective: data.elective ?? false,
      active: data.active ?? true,
    });
    if (error) {
      throw new Error(
        error.code === "23505" ? "That subject code already exists for this level." : error.message,
      );
    }
    return { ok: true };
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("subjects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------ policy & branding ------------------------ */

export const saveTenantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tenantSettingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("tenant_settings")
      .upsert(
        {
          school_id: data.schoolId,
          positions: data.positions,
          departments: data.departments,
          schedule_types: data.scheduleTypes,
          rating_scale: data.ratingScale ?? DEFAULT_RATING_SCALE,
          grading_system: data.gradingSystem,
          academic_year_start_month: data.academicYearStartMonth,
          week_starts_on: data.weekStartsOn,
          features: mergedFeatures(data.features),
        },
        { onConflict: "school_id" },
      );
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "tenant_settings_saved",
      description: "Updated tenant policy and module availability",
      details: { schoolId: data.schoolId },
    });
    return { ok: true };
  });

export const saveBranding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => brandingSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("school_branding").upsert(
      {
        school_id: data.schoolId,
        display_name: data.displayName ?? "",
        tagline: data.tagline ?? "",
        logo_url: data.logoUrl ?? null,
        primary_color: data.primaryColor,
        accent_color: data.accentColor,
        language: data.language,
        currency: data.currency,
        locale: data.locale,
        date_format: data.dateFormat,
        show_powered_by: data.showPoweredBy ?? true,
      },
      { onConflict: "school_id" },
    );
    if (error) throw new Error(error.message);
    await logAudit(context.supabase, context.userId, {
      action: "branding_saved",
      description: "Updated school branding",
      details: { schoolId: data.schoolId },
    });
    return { ok: true };
  });
