import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, GraduationCap, Loader2, Palette, Plus, Save, Settings2, Tags, Trash2 } from "lucide-react";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODULES } from "@/lib/access";
import {
  CURRENCIES,
  DATE_FORMATS,
  GRADING_SYSTEMS,
  LANGUAGES,
  MONTHS,
  brandingStyle,
  joinList,
  mergedFeatures,
  splitList,
  type EducationLevel,
  type School,
  type SchoolBranding,
  type SchoolType,
  type Subject,
  type TenantSettings,
} from "@/lib/config";
import {
  brandingSchema,
  educationLevelSchema,
  schoolSchema,
  schoolTypeSchema,
  subjectSchema,
  tenantSettingsSchema,
} from "@/lib/config.schemas";
import {
  createEducationLevel,
  createSchool,
  createSchoolType,
  createSubject,
  deleteSchool,
  deleteSubject,
  getConfiguration,
  saveBranding,
  saveTenantSettings,
} from "@/lib/config.functions";

/* ----------------------------- helpers ----------------------------- */

type Errors = Record<string, string>;

/** Validate once, surface field-level messages, never submit invalid input. */
function validate<T>(schema: ZodType<T>, value: unknown): { data?: T; errors: Errors } {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data, errors: {} };
  const errors: Errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    errors[key] ??= issue.message;
  }
  return { errors };
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

const EMPTY_SCHOOL = {
  name: "",
  code: "",
  country: "",
  region: "",
  timezone: "UTC",
  currency: "USD",
  locale: "en-US",
  typeCode: "",
  levelCodes: [] as string[],
};

/* ---------------------------- component ---------------------------- */

export function SystemConfiguration() {
  const load = useServerFn(getConfiguration);
  const addSchool = useServerFn(createSchool);
  const removeSchool = useServerFn(deleteSchool);
  const addLevel = useServerFn(createEducationLevel);
  const addType = useServerFn(createSchoolType);
  const addSubject = useServerFn(createSubject);
  const removeSubject = useServerFn(deleteSubject);
  const savePolicy = useServerFn(saveTenantSettings);
  const saveBrand = useServerFn(saveBranding);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [types, setTypes] = useState<SchoolType[]>([]);
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [settings, setSettings] = useState<TenantSettings[]>([]);
  const [branding, setBranding] = useState<SchoolBranding[]>([]);
  const [schoolId, setSchoolId] = useState("");

  const refresh = useCallback(async () => {
    const data = await load();
    setTypes(data.types as SchoolType[]);
    setLevels(data.levels as EducationLevel[]);
    setSchools(data.schools as School[]);
    setSubjects(data.subjects as Subject[]);
    setSettings(data.settings as unknown as TenantSettings[]);
    setBranding(data.branding as SchoolBranding[]);
    setSchoolId((current) => {
      const list = data.schools as School[];
      return list.some((s) => s.id === current) ? current : (list[0]?.id ?? "");
    });
  }, [load]);

  useEffect(() => {
    void refresh()
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load configuration"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast.success(success);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const school = schools.find((s) => s.id === schoolId);
  const schoolSubjects = useMemo(
    () => subjects.filter((s) => s.school_id === schoolId),
    [subjects, schoolId],
  );
  const schoolSettings = settings.find((s) => s.school_id === schoolId) ?? null;
  const schoolBranding = branding.find((b) => b.school_id === schoolId) ?? null;

  if (loading) {
    return (
      <div className="surface flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading configuration…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Tenant catalogue</h2>
          <p className="text-sm text-muted-foreground">
            {schools.length} school{schools.length === 1 ? "" : "s"} · {levels.length} education levels ·{" "}
            {types.length} school types · {subjects.length} subjects
          </p>
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          <Label>Active school</Label>
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger>
              <SelectValue placeholder={schools.length ? "Select a school" : "No schools yet"} />
            </SelectTrigger>
            <SelectContent>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Tabs defaultValue="schools" className="surface p-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="schools">
            <Building2 className="size-4" aria-hidden /> Schools
          </TabsTrigger>
          <TabsTrigger value="levels">
            <GraduationCap className="size-4" aria-hidden /> Education levels
          </TabsTrigger>
          <TabsTrigger value="types">
            <Tags className="size-4" aria-hidden /> School types
          </TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="policy">
            <Settings2 className="size-4" aria-hidden /> Tenant policy
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="size-4" aria-hidden /> Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="mt-6">
          <SchoolsSection
            types={types}
            levels={levels}
            schools={schools}
            busy={busy}
            onCreate={(payload) => run(() => addSchool({ data: payload }), "School provisioned")}
            onDelete={(id) => run(() => removeSchool({ data: { id } }), "School removed")}
          />
        </TabsContent>

        <TabsContent value="levels" className="mt-6">
          <LevelsSection
            levels={levels}
            busy={busy}
            onCreate={(payload) => run(() => addLevel({ data: payload }), "Education level added")}
          />
        </TabsContent>

        <TabsContent value="types" className="mt-6">
          <TypesSection
            types={types}
            busy={busy}
            onCreate={(payload) => run(() => addType({ data: payload }), "School type added")}
          />
        </TabsContent>

        <TabsContent value="subjects" className="mt-6">
          <SubjectsSection
            school={school ?? null}
            levels={levels}
            subjects={schoolSubjects}
            busy={busy}
            onCreate={(payload) => run(() => addSubject({ data: payload }), "Subject added")}
            onDelete={(id) => run(() => removeSubject({ data: { id } }), "Subject removed")}
          />
        </TabsContent>

        <TabsContent value="policy" className="mt-6">
          <PolicySection
            school={school ?? null}
            settings={schoolSettings}
            busy={busy}
            onSave={(payload) => run(() => savePolicy({ data: payload }), "Configuration saved")}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSection
            school={school ?? null}
            branding={schoolBranding}
            busy={busy}
            onSave={(payload) => run(() => saveBrand({ data: payload }), "Branding saved")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------- sections ---------------------------- */

function SchoolsSection({
  types,
  levels,
  schools,
  busy,
  onCreate,
  onDelete,
}: {
  types: SchoolType[];
  levels: EducationLevel[];
  schools: School[];
  busy: boolean;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState({ ...EMPTY_SCHOOL });
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof typeof EMPTY_SCHOOL, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleLevel = (code: string, on: boolean) =>
    setForm((f) => ({
      ...f,
      levelCodes: on ? [...f.levelCodes, code] : f.levelCodes.filter((c) => c !== code),
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: issues } = validate(schoolSchema, form);
    setErrors(issues);
    if (!data) return;
    if (await onCreate(data as unknown as Record<string, unknown>)) setForm({ ...EMPTY_SCHOOL });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <h3 className="text-base font-semibold">Provision a school</h3>
          <p className="text-sm text-muted-foreground">
            Every record in the system is scoped to a school, so tenants scale without code changes.
          </p>
        </div>
        <Field label="School name" error={errors["name"]}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Short code" error={errors["code"]}>
          <Input placeholder="ACCRA01" value={form.code} onChange={(e) => set("code", e.target.value)} />
        </Field>
        <Field label="School type" error={errors["typeCode"]}>
          <Select value={form.typeCode} onValueChange={(v) => set("typeCode", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.code} value={t.code}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Country" error={errors["country"]}>
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field label="Region / state" error={errors["region"]}>
          <Input value={form.region} onChange={(e) => set("region", e.target.value)} />
        </Field>
        <Field label="Timezone" error={errors["timezone"]}>
          <Input
            placeholder="Africa/Accra"
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          />
        </Field>
        <Field label="Currency (ISO)" error={errors["currency"]}>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Locale" error={errors["locale"]}>
          <Input placeholder="en-GH" value={form.locale} onChange={(e) => set("locale", e.target.value)} />
        </Field>
        <Field label="Education levels offered" error={errors["levelCodes"]} className="sm:col-span-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {levels.map((l) => (
              <label key={l.code} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                <Checkbox
                  checked={form.levelCodes.includes(l.code)}
                  onCheckedChange={(v) => toggleLevel(l.code, v === true)}
                />
                {l.name}
              </label>
            ))}
          </div>
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" aria-hidden /> Provision school
          </Button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {schools.map((s) => (
          <article key={s.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {s.name} <span className="text-xs text-muted-foreground">({s.code})</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {types.find((t) => t.code === s.type_code)?.name ?? s.type_code} · {s.country}
                  {s.region ? `, ${s.region}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.currency} · {s.locale} · {s.timezone} · {s.level_codes.length} levels
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${s.name}`}
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Remove ${s.name} and everything scoped to it?`)) void onDelete(s.id);
                }}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden />
              </Button>
            </div>
          </article>
        ))}
        {schools.length === 0 ? (
          <p className="text-sm text-muted-foreground">No schools provisioned yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function LevelsSection({
  levels,
  busy,
  onCreate,
}: {
  levels: EducationLevel[];
  busy: boolean;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const empty = { code: "", name: "", sortOrder: String(levels.length + 1), minAge: "", maxAge: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: issues } = validate(educationLevelSchema, {
      code: form.code,
      name: form.name,
      sortOrder: Number(form.sortOrder) || levels.length + 1,
      minAge: form.minAge === "" ? null : Number(form.minAge),
      maxAge: form.maxAge === "" ? null : Number(form.maxAge),
    });
    setErrors(issues);
    if (!data) return;
    if (await onCreate(data as unknown as Record<string, unknown>)) setForm(empty);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Code" error={errors["code"]}>
          <Input
            placeholder="post-graduate"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </Field>
        <Field label="Display name" error={errors["name"]}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Order" error={errors["sortOrder"]}>
          <Input
            type="number"
            min={1}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
        </Field>
        <Field label="Minimum age" error={errors["minAge"]}>
          <Input
            type="number"
            min={0}
            value={form.minAge}
            onChange={(e) => setForm({ ...form, minAge: e.target.value })}
          />
        </Field>
        <Field label="Maximum age" error={errors["maxAge"]}>
          <Input
            type="number"
            min={0}
            value={form.maxAge}
            onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" aria-hidden /> Add level
          </Button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {levels.map((l) => (
          <article key={l.id} className="rounded-xl border border-border p-4">
            <p className="font-semibold">
              {l.sort_order}. {l.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {l.code}
              {l.min_age != null || l.max_age != null
                ? ` · ages ${l.min_age ?? "?"}–${l.max_age ?? "?"}`
                : ""}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function TypesSection({
  types,
  busy,
  onCreate,
}: {
  types: SchoolType[];
  busy: boolean;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const empty = { code: "", name: "", description: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: issues } = validate(schoolTypeSchema, form);
    setErrors(issues);
    if (!data) return;
    if (await onCreate(data as unknown as Record<string, unknown>)) setForm(empty);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Code" error={errors["code"]}>
          <Input
            placeholder="charter"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </Field>
        <Field label="Display name" error={errors["name"]}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Description" error={errors["description"]}>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div>
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" aria-hidden /> Add type
          </Button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {types.map((t) => (
          <article key={t.id} className="rounded-xl border border-border p-4">
            <p className="font-semibold">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.code}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SubjectsSection({
  school,
  levels,
  subjects,
  busy,
  onCreate,
  onDelete,
}: {
  school: School | null;
  levels: EducationLevel[];
  subjects: Subject[];
  busy: boolean;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const empty = { levelCode: "", code: "", name: "", credits: "", elective: false };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});

  if (!school) {
    return <p className="text-sm text-muted-foreground">Provision a school first.</p>;
  }

  const offered = levels.filter((l) => school.level_codes.includes(l.code));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: issues } = validate(subjectSchema, {
      schoolId: school.id,
      levelCode: form.levelCode,
      code: form.code,
      name: form.name,
      credits: form.credits === "" ? null : Number(form.credits),
      elective: form.elective,
    });
    setErrors(issues);
    if (!data) return;
    if (await onCreate(data as unknown as Record<string, unknown>)) setForm(empty);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Education level" error={errors["levelCode"]}>
          <Select value={form.levelCode} onValueChange={(v) => setForm({ ...form, levelCode: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {offered.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Subject code" error={errors["code"]}>
          <Input
            placeholder="MTH"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </Field>
        <Field label="Subject name" error={errors["name"]}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Credits" error={errors["credits"]}>
          <Input
            type="number"
            min={0}
            step="0.5"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
          />
        </Field>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="subject-elective"
            checked={form.elective}
            onCheckedChange={(v) => setForm({ ...form, elective: v })}
          />
          <Label htmlFor="subject-elective">Elective</Label>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" aria-hidden /> Add subject
          </Button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {subjects.map((s) => (
          <article key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <p className="font-semibold">
                {s.code} — {s.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {levels.find((l) => l.code === s.level_code)?.name ?? s.level_code}
                {s.credits != null ? ` · ${s.credits} credits` : ""}
              </p>
              {s.elective ? (
                <Badge variant="secondary" className="mt-2">
                  Elective
                </Badge>
              ) : null}
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Remove ${s.name}`}
              disabled={busy}
              onClick={() => void onDelete(s.id)}
            >
              <Trash2 className="size-4 text-destructive" aria-hidden />
            </Button>
          </article>
        ))}
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects for this school yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function PolicySection({
  school,
  settings,
  busy,
  onSave,
}: {
  school: School | null;
  settings: TenantSettings | null;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    positions: "",
    departments: "",
    scheduleTypes: "",
    gradingSystem: "letter",
    academicYearStartMonth: "9",
    weekStartsOn: "monday",
  });
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!settings) return;
    setForm({
      positions: joinList(settings.positions),
      departments: joinList(settings.departments),
      scheduleTypes: joinList(settings.schedule_types),
      gradingSystem: settings.grading_system,
      academicYearStartMonth: String(settings.academic_year_start_month),
      weekStartsOn: settings.week_starts_on,
    });
    setFeatures(mergedFeatures(settings.features));
  }, [settings]);

  if (!school) return <p className="text-sm text-muted-foreground">Provision a school first.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: issues } = validate(tenantSettingsSchema, {
      schoolId: school.id,
      positions: splitList(form.positions),
      departments: splitList(form.departments),
      scheduleTypes: splitList(form.scheduleTypes),
      gradingSystem: form.gradingSystem,
      academicYearStartMonth: Number(form.academicYearStartMonth),
      weekStartsOn: form.weekStartsOn,
      features: mergedFeatures(features),
    });
    setErrors(issues);
    if (!data) return;
    await onSave(data as unknown as Record<string, unknown>);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Staff positions (comma separated)" error={errors["positions"]} className="sm:col-span-3">
          <Textarea
            rows={2}
            value={form.positions}
            onChange={(e) => setForm({ ...form, positions: e.target.value })}
          />
        </Field>
        <Field label="Departments (comma separated)" error={errors["departments"]} className="sm:col-span-3">
          <Textarea
            rows={2}
            value={form.departments}
            onChange={(e) => setForm({ ...form, departments: e.target.value })}
          />
        </Field>
        <Field label="Schedule types (comma separated)" error={errors["scheduleTypes"]} className="sm:col-span-3">
          <Textarea
            rows={2}
            value={form.scheduleTypes}
            onChange={(e) => setForm({ ...form, scheduleTypes: e.target.value })}
          />
        </Field>
        <Field label="Grading system" error={errors["gradingSystem"]}>
          <Select value={form.gradingSystem} onValueChange={(v) => setForm({ ...form, gradingSystem: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADING_SYSTEMS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Academic year starts" error={errors["academicYearStartMonth"]}>
          <Select
            value={form.academicYearStartMonth}
            onValueChange={(v) => setForm({ ...form, academicYearStartMonth: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Week starts on" error={errors["weekStartsOn"]}>
          <Select value={form.weekStartsOn} onValueChange={(v) => setForm({ ...form, weekStartsOn: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div>
        <h3 className="text-base font-semibold">Module availability</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Turning a module off hides it for this school; role and access-level rules still apply.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <label key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
              <span>{m.name}</span>
              <Switch
                checked={features[m.id] ?? true}
                onCheckedChange={(v) => setFeatures((f) => ({ ...f, [m.id]: v }))}
              />
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        <Save className="size-4" aria-hidden /> Save configuration
      </Button>
    </form>
  );
}

function BrandingSection({
  school,
  branding,
  busy,
  onSave,
}: {
  school: School | null;
  branding: SchoolBranding | null;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    displayName: "",
    tagline: "",
    logoUrl: "",
    primaryColor: "#2f6f8f",
    accentColor: "#d9a441",
    language: "en",
    currency: "USD",
    locale: "en-US",
    dateFormat: "dmy",
    showPoweredBy: true,
  });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!branding) return;
    setForm({
      displayName: branding.display_name,
      tagline: branding.tagline,
      logoUrl: branding.logo_url ?? "",
      primaryColor: branding.primary_color,
      accentColor: branding.accent_color,
      language: branding.language,
      currency: branding.currency,
      locale: branding.locale,
      dateFormat: branding.date_format,
      showPoweredBy: branding.show_powered_by,
    });
  }, [branding]);

  if (!school) return <p className="text-sm text-muted-foreground">Provision a school first.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, errors: issues } = validate(brandingSchema, {
      schoolId: school.id,
      ...form,
      logoUrl: form.logoUrl.trim() === "" ? null : form.logoUrl.trim(),
    });
    setErrors(issues);
    if (!data) return;
    await onSave(data as unknown as Record<string, unknown>);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Display name" error={errors["displayName"]}>
          <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </Field>
        <Field label="Tagline" error={errors["tagline"]} className="sm:col-span-2">
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </Field>
        <Field label="Logo address (https)" error={errors["logoUrl"]} className="sm:col-span-3">
          <Input
            placeholder="https://…/logo.png"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
        </Field>
        <Field label="Primary colour" error={errors["primaryColor"]}>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-16 p-1"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
            <Input
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Accent colour" error={errors["accentColor"]}>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-16 p-1"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
            />
            <Input
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Language" error={errors["language"]}>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Currency" error={errors["currency"]}>
          <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Locale" error={errors["locale"]}>
          <Input value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
        </Field>
        <Field label="Date format" error={errors["dateFormat"]}>
          <Select value={form.dateFormat} onValueChange={(v) => setForm({ ...form, dateFormat: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="powered-by"
            checked={form.showPoweredBy}
            onCheckedChange={(v) => setForm({ ...form, showPoweredBy: v })}
          />
          <Label htmlFor="powered-by">Show “powered by” footer</Label>
        </div>
      </div>

      <div
        className="rounded-xl border border-border p-5"
        style={brandingStyle({ primary_color: form.primaryColor, accent_color: form.accentColor })}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
        <div className="mt-3 flex items-center gap-3">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="School logo preview" className="size-12 rounded-lg object-contain" />
          ) : null}
          <div>
            <p className="text-lg font-bold">{form.displayName || school.name}</p>
            <p className="text-sm text-muted-foreground">{form.tagline || "Tagline goes here"}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" size="sm">
            Primary action
          </Button>
          <Button type="button" size="sm" variant="secondary">
            Secondary
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        <Save className="size-4" aria-hidden /> Save branding
      </Button>
    </form>
  );
}
