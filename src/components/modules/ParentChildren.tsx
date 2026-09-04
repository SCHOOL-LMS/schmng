import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Receipt,
  TrendingUp,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChildDetail, getMyChildren } from "@/lib/admissions.functions";
import { money } from "@/lib/admissions";

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));

export function ParentChildren() {
  const loadChildren = useServerFn(getMyChildren);
  const loadDetail = useServerFn(getChildDetail);

  const [children, setChildren] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getChildDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    void loadChildren()
      .then((rows) => setChildren(rows as Row[]))
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Could not load your children."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    void loadDetail({ data: { id: selected } })
      .then(setDetail)
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Could not load the record."),
      )
      .finally(() => setDetailLoading(false));
  }, [selected]);

  if (loading) {
    return (
      <div className="surface flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading your children…
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="surface p-6">
        <h2 className="text-lg font-semibold">No children linked to this account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Parent accounts exist only for families with a child admitted to the school. Contact the
          school office if you believe this is an error.
        </p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All children
        </button>
        {detailLoading || !detail ? (
          <div className="surface flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading record…
          </div>
        ) : (
          <ChildDetail detail={detail} />
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children.map((c) => {
        const teacher = c["teacher"] as Row | null;
        return (
          <button
            key={s(c["id"])}
            type="button"
            onClick={() => setSelected(s(c["id"]))}
            className="surface p-5 text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{s(c["student_name"])}</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {s(c["admission_number"])}
                </p>
              </div>
            </div>
            <dl className="mt-4 space-y-1.5 text-sm">
              <Line label="Class" value={s(c["class_admitted"])} />
              <Line label="Class teacher" value={teacher ? s(teacher["teacher_name"]) : "—"} />
              <Line label="Teacher contact" value={teacher ? s(teacher["teacher_phone"]) : "—"} />
              <Line label="Teacher email" value={teacher ? s(teacher["teacher_email"]) : "—"} />
            </dl>
            <p className="mt-4 text-xs font-medium text-primary">View full record →</p>
          </button>
        );
      })}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value || "—"}</dd>
    </div>
  );
}

function ChildDetail({ detail }: { detail: Awaited<ReturnType<typeof getChildDetail>> }) {
  const a = detail.admission as Row;
  const teacher = detail.teacher as Row | null;
  const fees = detail.fees as Row[];
  const attendance = detail.attendance as Row[];
  const performance = detail.performance as Row[];
  const exeat = (detail.exeat as Row[])[0] ?? null;

  const due = fees.reduce((t, f) => t + Number(f["amount_due"] ?? 0), 0);
  const paid = fees.reduce((t, f) => t + Number(f["amount_paid"] ?? 0), 0);
  const present = attendance.filter((r) => r["status"] === "present").length;
  const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const average = performance.length
    ? Math.round(performance.reduce((t, p) => t + Number(p["score"] ?? 0), 0) / performance.length)
    : 0;

  return (
    <div className="space-y-4">
      <header className="surface p-6">
        <h2 className="text-2xl font-bold">{s(a["student_name"])}</h2>
        <p className="text-sm text-muted-foreground">
          {s(a["admission_number"])} · {s(a["class_admitted"])} · {s(a["gender"])}
        </p>
        {teacher && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="font-medium">Class teacher: {s(teacher["teacher_name"])}</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5" aria-hidden /> {s(teacher["teacher_phone"]) || "—"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5" aria-hidden /> {s(teacher["teacher_email"]) || "—"}
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat icon={TrendingUp} label="Average score" value={`${average}%`} />
        <Stat icon={CalendarCheck} label="Attendance" value={`${rate}%`} />
        <Stat icon={Receipt} label="Fees outstanding" value={money(due - paid)} />
        <Stat
          icon={DoorOpen}
          label="Exeat status"
          value={exeat && exeat["status"] === "out" ? "Out of school" : "In school"}
        />
      </div>

      <section className="surface p-5">
        <h3 className="mb-3 font-semibold">Exeat / permission status</h3>
        {exeat ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Detail
              label="Status"
              value={exeat["status"] === "out" ? "Temporarily permitted out" : "In school"}
            />
            <Detail label="Signed by" value={s(exeat["signed_by_name"])} />
            <Detail label="Reason" value={s(exeat["reason"])} />
            <Detail label="Destination" value={s(exeat["destination"])} />
            <Detail label="Departed" value={fmt(exeat["departed_at"])} />
            <Detail label="Allowed return" value={fmt(exeat["return_at"])} />
            <Detail label="Returned" value={fmt(exeat["returned_at"])} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            In school — no exeat has been issued for this child.
          </p>
        )}
      </section>

      <section className="surface p-5">
        <h3 className="mb-3 font-semibold">Performance & assessment records</h3>
        <Table
          head={["Term", "Subject", "Type", "Score", "Grade", "Remarks"]}
          rows={performance.map((p) => [
            s(p["term"]),
            s(p["subject"]),
            s(p["assessment_type"]),
            s(p["score"]),
            s(p["grade"]),
            s(p["remarks"]),
          ])}
          empty="No assessment records published yet."
        />
      </section>

      <section className="surface p-5">
        <h3 className="mb-3 font-semibold">Fees payment status</h3>
        <Table
          head={["Term", "Due", "Paid", "Balance", "Status"]}
          rows={fees.map((f) => [
            s(f["term"]),
            money(Number(f["amount_due"] ?? 0)),
            money(Number(f["amount_paid"] ?? 0)),
            money(Number(f["amount_due"] ?? 0) - Number(f["amount_paid"] ?? 0)),
            s(f["status"]),
          ])}
          empty="No fee records yet."
        />
      </section>

      <section className="surface p-5">
        <h3 className="mb-3 font-semibold">Attendance report</h3>
        <Table
          head={["Date", "Status", "Note"]}
          rows={attendance
            .slice(0, 30)
            .map((r) => [s(r["attendance_date"]), s(r["status"]), s(r["note"])])}
          empty="No attendance has been recorded yet."
        />
      </section>
    </div>
  );
}

function fmt(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value || "—"}</dd>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div className="surface flex items-center gap-3 p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left">
          <tr>
            {head.map((h) => (
              <th key={h} className="p-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60">
              {r.map((c, j) => (
                <td key={j} className="p-3">
                  {c || "—"}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-6 text-center text-muted-foreground" colSpan={head.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
