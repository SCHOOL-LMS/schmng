import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Loader2, Plus, Search, Trash2, Pencil, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ADMISSION_CLASSES,
  ADMISSION_FIELDS,
  ADMISSION_GENDERS,
  ADMISSION_TABS,
  downloadCsv,
  toColumn,
} from "@/lib/admissions";
import {
  createAdmission,
  deleteAdmission,
  getAdmissionsOverview,
  saveClassTeacher,
  updateAdmission,
} from "@/lib/admissions.functions";

type Row = Record<string, unknown>;

function emptyForm() {
  const f: Record<string, string> = {};
  for (const field of ADMISSION_FIELDS) f[field.name] = "";
  f["disabilityStatus"] = "No";
  f["gender"] = "Male";
  return f;
}

function fromRow(row: Row) {
  const f = emptyForm();
  for (const field of ADMISSION_FIELDS) {
    const v = row[toColumn(field.name)];
    f[field.name] = v == null ? "" : String(v);
  }
  return f;
}

export function AdmissionsManagement() {
  const load = useServerFn(getAdmissionsOverview);
  const create = useServerFn(createAdmission);
  const update = useServerFn(updateAdmission);
  const remove = useServerFn(deleteAdmission);
  const saveTeacher = useServerFn(saveClassTeacher);

  const [rows, setRows] = useState<Row[]>([]);
  const [teachers, setTeachers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [credentials, setCredentials] = useState<{
    admissionNumber: string;
    parentEmail: string;
    parentPassword: string | null;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  const refresh = async () => {
    try {
      const data = await load();
      setRows(data.admissions as Row[]);
      setTeachers(data.classTeachers as Row[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load admissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matches =
        !q ||
        String(r["student_name"] ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r["admission_number"] ?? "")
          .toLowerCase()
          .includes(q) ||
        String(r["parent_email"] ?? "")
          .toLowerCase()
          .includes(q);
      const cls = classFilter === "all" || r["class_admitted"] === classFilter;
      const gen = genderFilter === "all" || r["gender"] === genderFilter;
      return matches && cls && gen;
    });
  }, [rows, search, classFilter, genderFilter]);

  const submit = async (values: Record<string, string>) => {
    setBusy(true);
    try {
      const payload = { ...values } as Record<string, string>;
      if (editing) {
        await update({ data: { ...payload, id: editing["id"] as string } as never });
        toast.success("Admission updated.");
      } else {
        const res = await create({ data: payload as never });
        setCredentials({
          admissionNumber: res.admissionNumber,
          parentEmail: res.parentEmail,
          parentPassword: res.parentPassword,
        });
        toast.success(`Admitted — admission number ${res.admissionNumber}`);
      }
      setOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the admission.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const cols = [
      "admission_number",
      "student_name",
      "gender",
      "class_admitted",
      "parent_name",
      "parent_email",
      "parent_phone",
      "status",
    ];
    downloadCsv("admissions.csv", [
      cols,
      ...filtered.map((r) => cols.map((c) => (r[c] == null ? "" : String(r[c])))),
    ]);
  };

  const byClass = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = String(r["class_admitted"] ?? "—");
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  if (loading) {
    return (
      <div className="surface flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading admissions…
      </div>
    );
  }

  return (
    <Tabs defaultValue="admissions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="admissions">Admissions</TabsTrigger>
        <TabsTrigger value="teachers">Class Teachers</TabsTrigger>
        <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="admissions" className="space-y-4">
        <div className="surface flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-56 flex-1">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Search name, admission no or parent email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {ADMISSION_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              {ADMISSION_GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden /> New admission
          </Button>
        </div>

        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Admission No</th>
                <th className="p-3 font-medium">Student</th>
                <th className="p-3 font-medium">Class</th>
                <th className="p-3 font-medium">Gender</th>
                <th className="p-3 font-medium">Parent</th>
                <th className="p-3 font-medium">Parent email</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={String(r["id"])} className="border-b border-border/60">
                  <td className="p-3 font-mono text-xs">{String(r["admission_number"] ?? "")}</td>
                  <td className="p-3 font-medium">{String(r["student_name"] ?? "")}</td>
                  <td className="p-3">{String(r["class_admitted"] ?? "")}</td>
                  <td className="p-3">{String(r["gender"] ?? "")}</td>
                  <td className="p-3">{String(r["parent_name"] ?? "")}</td>
                  <td className="p-3">{String(r["parent_email"] ?? "")}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!confirm(`Delete ${String(r["student_name"])}?`)) return;
                          await remove({ data: { id: r["id"] as string } });
                          toast.success("Admission deleted.");
                          await refresh();
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                    No admissions match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="teachers">
        <ClassTeachers
          teachers={teachers}
          onSave={async (v) => {
            await saveTeacher({ data: v });
            toast.success("Class teacher saved.");
            await refresh();
          }}
        />
      </TabsContent>

      <TabsContent value="reports">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total admissions" value={rows.length} />
          <Stat label="Classes in use" value={byClass.length} />
          <Stat
            label="With disability support"
            value={rows.filter((r) => r["disability_status"] === "Yes").length}
          />
        </div>
        <div className="surface mt-4 p-5">
          <h3 className="mb-3 font-semibold">Admissions by class</h3>
          <div className="space-y-2">
            {byClass.map(([cls, n]) => (
              <div key={cls} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0">{cls}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.round((n / rows.length) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums">{n}</span>
              </div>
            ))}
            {byClass.length === 0 && (
              <p className="text-sm text-muted-foreground">No admissions recorded yet.</p>
            )}
          </div>
        </div>
      </TabsContent>

      <AdmissionDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        busy={busy}
        onSubmit={submit}
      />

      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4" aria-hidden /> Login details
            </DialogTitle>
            <DialogDescription>
              Share these with the family. They are shown only once.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <dl className="space-y-3 text-sm">
              <Detail label="Admission number" value={credentials.admissionNumber} />
              <Detail label="Parent login email" value={credentials.parentEmail} />
              <Detail
                label="Parent password"
                value={
                  credentials.parentPassword ??
                  "Existing parent account — the current password still applies."
                }
              />
              <Detail
                label="Student login"
                value={`${credentials.parentEmail} + ${credentials.admissionNumber}`}
              />
            </dl>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-all font-medium">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

function AdmissionDialog({
  open,
  onOpenChange,
  editing,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Row | null;
  busy: boolean;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>(emptyForm());

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setForm(editing ? fromRow(editing) : emptyForm());
  }, [open, editing]);

  const tab = ADMISSION_TABS[step]!;
  const visible = tab.fields.filter(
    (f) => !f.conditional || form[f.conditional.field] === f.conditional.value,
  );
  const last = step === ADMISSION_TABS.length - 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit admission" : "New admission"}</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {ADMISSION_TABS.length} — {tab.title}. The admission number is
            generated automatically in sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${((step + 1) / ADMISSION_TABS.length) * 100}%` }}
          />
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          {visible.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={`adm-${f.name}`}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "select" ? (
                <Select
                  value={form[f.name] ?? ""}
                  onValueChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}
                >
                  <SelectTrigger id={`adm-${f.name}`}>
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`adm-${f.name}`}
                  type={f.type ?? "text"}
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              )}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}

          <DialogFooter className="sm:col-span-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            <Button type="submit" disabled={busy}>
              {last ? (editing ? "Save changes" : "Admit student") : "Next"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClassTeachers({
  teachers,
  onSave,
}: {
  teachers: Row[];
  onSave: (v: {
    className: string;
    teacherName: string;
    teacherEmail: string;
    teacherPhone: string;
  }) => Promise<void>;
}) {
  const [className, setClassName] = useState<string>(ADMISSION_CLASSES[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="space-y-4">
      <form
        className="surface grid gap-3 p-4 sm:grid-cols-5"
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            className,
            teacherName: name,
            teacherEmail: email,
            teacherPhone: phone,
          });
          setName("");
          setEmail("");
          setPhone("");
        }}
      >
        <div className="space-y-2">
          <Label>Class</Label>
          <Select value={className} onValueChange={setClassName}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMISSION_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ct-name">Teacher name</Label>
          <Input id="ct-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ct-email">Email</Label>
          <Input
            id="ct-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ct-phone">Contact</Label>
          <Input id="ct-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Save
          </Button>
        </div>
      </form>

      <div className="surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Class</th>
              <th className="p-3 font-medium">Teacher</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={String(t["id"])} className="border-b border-border/60">
                <td className="p-3">{String(t["class_name"])}</td>
                <td className="p-3 font-medium">{String(t["teacher_name"])}</td>
                <td className="p-3">{String(t["teacher_email"])}</td>
                <td className="p-3">{String(t["teacher_phone"])}</td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={4}>
                  No class teachers assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
