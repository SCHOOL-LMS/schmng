import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, UserPlus, Check, X, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/useSession";
import { createAccount } from "@/lib/admin.functions";
import {
  createOfferLetter,
  createPerformanceReview,
  createSchedule,
  deleteOfferLetter,
  deletePerformanceReview,
  deleteSchedule,
  getStaffOverview,
  setOfferStatus,
} from "@/lib/staff.functions";
import {
  currency,
  OFFER_STATUSES,
  POSITIONS,
  RATINGS,
  REVIEW_PERIODS,
  SCHEDULE_TYPES,
} from "@/lib/staff";
import { DEPARTMENTS, generateSecurePassword } from "@/lib/user-management";
import { UserFormDialog, type UserFormValues } from "./UserFormDialog";

interface StaffRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  position: string | null;
  department: string | null;
  employee_id: string | null;
  salary: number | null;
  start_date: string | null;
  status: string;
}

interface PerformanceRow {
  id: string;
  staff_id: string;
  review_period: string;
  rating: string;
  rating_score: number;
  comments: string;
  created_at: string;
}

interface ScheduleRow {
  id: string;
  staff_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
}

interface OfferRow {
  id: string;
  candidate_name: string;
  candidate_email: string;
  position: string;
  salary: number;
  start_date: string;
  status: string;
}

const OFFER_STYLE: Record<string, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  approved: "border-success/30 bg-success/10 text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function StaffManagement() {
  const { profile } = useSession();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "school_manager";

  const fetchOverview = useServerFn(getStaffOverview);
  const addAccount = useServerFn(createAccount);
  const addReview = useServerFn(createPerformanceReview);
  const dropReview = useServerFn(deletePerformanceReview);
  const addSchedule = useServerFn(createSchedule);
  const dropSchedule = useServerFn(deleteSchedule);
  const addOffer = useServerFn(createOfferLetter);
  const changeOffer = useServerFn(setOfferStatus);
  const dropOffer = useServerFn(deleteOfferLetter);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [performance, setPerformance] = useState<PerformanceRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    try {
      const data = (await fetchOverview()) as unknown as {
        staff: StaffRow[];
        performance: PerformanceRow[];
        schedules: ScheduleRow[];
        offers: OfferRow[];
      };
      setStaff(data.staff);
      setPerformance(data.performance);
      setSchedules(data.schedules);
      setOffers(data.offers);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load staff data");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const nameOf = (id: string) => staff.find((s) => s.id === id)?.full_name ?? "Unknown";

  const metrics = useMemo(() => {
    const payroll = staff.reduce((sum, s) => sum + Number(s.salary ?? 0), 0);
    const avg =
      performance.length === 0
        ? 0
        : performance.reduce((s, p) => s + p.rating_score, 0) / performance.length;
    return {
      total: staff.length,
      teachers: staff.filter((s) => (s.position ?? "").toLowerCase() === "teacher").length,
      admins: staff.filter((s) => s.role !== "staff").length,
      payroll,
      avg,
    };
  }, [staff, performance]);

  /** Onboarding reuses the exact user-creation interface and database. */
  const onboard = async (values: UserFormValues) => {
    setBusy(true);
    try {
      await addAccount({
        data: {
          fullName: values.fullName,
          email: values.email.trim(),
          password: values.password,
          role: values.role,
          accessLevel: values.accessLevel,
          username: values.username || null,
          gender: values.gender || null,
          department: values.department || null,
          className: values.className || null,
          twoFactorEnabled: values.twoFactorEnabled,
          permissions: values.permissions,
          phone: values.phone || null,
          position: values.position || null,
          salary: values.salary ? Number(values.salary) : null,
          startDate: values.startDate || null,
        },
      });
      toast.success("Staff member onboarded — employee ID generated");
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not onboard the staff member");
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await addReview({
        data: {
          staffId: String(f.get("staffId")),
          reviewPeriod: String(f.get("reviewPeriod")) as "monthly",
          rating: String(f.get("rating")) as "good",
          comments: String(f.get("comments") ?? ""),
        },
      });
      toast.success("Performance review recorded");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the review");
    }
  };

  const submitSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await addSchedule({
        data: {
          staffId: String(f.get("staffId")),
          scheduleDate: String(f.get("scheduleDate")),
          startTime: String(f.get("startTime")),
          endTime: String(f.get("endTime")),
          scheduleType: String(f.get("scheduleType")) as "regular",
        },
      });
      toast.success("Schedule created");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the schedule");
    }
  };

  const submitOffer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await addOffer({
        data: {
          candidateName: String(f.get("candidateName")),
          candidateEmail: String(f.get("candidateEmail")),
          position: String(f.get("position")),
          salary: Number(f.get("salary")),
          startDate: String(f.get("startDate")),
          status: String(f.get("status")) as "pending",
        },
      });
      toast.success("Offer letter created");
      e.currentTarget.reset();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the offer letter");
    }
  };

  if (!isAdmin) {
    return (
      <section className="surface p-6">
        <p className="text-sm text-muted-foreground">
          Staff management is available to administrators and school managers.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total staff" value={String(metrics.total)} />
        <Metric label="Teachers" value={String(metrics.teachers)} />
        <Metric label="Administrators" value={String(metrics.admins)} />
        <Metric label="Monthly payroll" value={currency(metrics.payroll)} />
      </div>

      <Tabs defaultValue="onboarding" className="surface p-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="directory">Staff directory</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="offers">Offer letters</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Onboarding uses the same account creation interface and database as User Management,
            so a new staff member gets a portal login, a payroll salary and an auto-generated
            employee ID in one step.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 size-4" /> Onboard staff member
          </Button>
        </TabsContent>

        <TabsContent value="directory" className="pt-6">
          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 size-4" /> Refresh
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead className="text-right">Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.employee_id ?? "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </TableCell>
                  <TableCell>{s.position ?? "—"}</TableCell>
                  <TableCell>{s.department ?? "—"}</TableCell>
                  <TableCell>{s.start_date ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {s.salary != null ? currency(Number(s.salary)) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No staff records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 pt-6">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitReview}>
            <StaffPicker staff={staff} />
            <div className="space-y-2">
              <Label>Review period</Label>
              <Select name="reviewPeriod" required defaultValue="quarterly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_PERIODS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select name="rating" required defaultValue="good">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATINGS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-comments">Comments</Label>
              <Textarea id="pf-comments" name="comments" rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Submit review</Button>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{nameOf(p.staff_id)}</TableCell>
                  <TableCell className="capitalize">{p.review_period}</TableCell>
                  <TableCell className="capitalize">
                    {p.rating.replace("-", " ")} ({p.rating_score})
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{p.comments || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await dropReview({ data: { id: p.id } });
                        await load();
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6 pt-6">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitSchedule}>
            <StaffPicker staff={staff} />
            <div className="space-y-2">
              <Label htmlFor="sc-date">Date</Label>
              <Input id="sc-date" name="scheduleDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-start">Start time</Label>
              <Input id="sc-start" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-end">End time</Label>
              <Input id="sc-end" name="endTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label>Schedule type</Label>
              <Select name="scheduleType" required defaultValue="regular">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create schedule</Button>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{nameOf(s.staff_id)}</TableCell>
                  <TableCell>{s.schedule_date}</TableCell>
                  <TableCell>
                    {s.start_time} – {s.end_time}
                  </TableCell>
                  <TableCell className="capitalize">{s.schedule_type}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await dropSchedule({ data: { id: s.id } });
                        await load();
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6 pt-6">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitOffer}>
            <div className="space-y-2">
              <Label htmlFor="of-name">Candidate name</Label>
              <Input id="of-name" name="candidateName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="of-email">Candidate email</Label>
              <Input id="of-email" name="candidateEmail" type="email" required />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select name="position" required defaultValue="Teacher">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="of-salary">Salary (GHS)</Label>
              <Input id="of-salary" name="salary" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="of-start">Start date</Label>
              <Input id="of-start" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" required defaultValue="pending">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create offer letter</Button>
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Start</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.candidate_name}</div>
                    <div className="text-xs text-muted-foreground">{o.candidate_email}</div>
                  </TableCell>
                  <TableCell>{o.position}</TableCell>
                  <TableCell>{o.start_date}</TableCell>
                  <TableCell className="text-right">{currency(Number(o.salary))}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs capitalize ${OFFER_STYLE[o.status] ?? ""}`}
                    >
                      {o.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Approve"
                      onClick={async () => {
                        await changeOffer({ data: { offerId: o.id, status: "approved" } });
                        await load();
                      }}
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Reject"
                      onClick={async () => {
                        await changeOffer({ data: { offerId: o.id, status: "rejected" } });
                        await load();
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={async () => {
                        await dropOffer({ data: { id: o.id } });
                        await load();
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="analytics" className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Total staff" value={String(metrics.total)} />
            <Metric label="Teachers" value={String(metrics.teachers)} />
            <Metric label="Total payroll" value={currency(metrics.payroll)} />
            <Metric label="Average rating" value={metrics.avg.toFixed(1)} />
            <Metric label="Schedules" value={String(schedules.length)} />
            <Metric label="Offer letters" value={String(offers.length)} />
          </div>
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold">Department distribution</h3>
            {DEPARTMENTS.map((d) => {
              const count = staff.filter((s) => s.department === d).length;
              if (count === 0) return null;
              const pct = Math.round((count / Math.max(staff.length, 1)) * 100);
              return (
                <div key={d} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{d}</span>
                    <span className="text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={null}
        busy={busy}
        onSubmit={onboard}
        defaultRole="staff"
        suggestedPassword={generateSecurePassword()}
      />
    </div>
  );
}

function StaffPicker({ staff }: { staff: StaffRow[] }) {
  return (
    <div className="space-y-2">
      <Label>Staff member</Label>
      <Select name="staffId" required>
        <SelectTrigger>
          <SelectValue placeholder="Select staff member" />
        </SelectTrigger>
        <SelectContent>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.full_name} {s.employee_id ? `· ${s.employee_id}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
