import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clearAuditLogs, listAuditLogs } from "@/lib/admin.functions";
import { downloadCsv } from "@/lib/user-management";

interface AuditRow {
  id: string;
  action: string;
  description: string;
  actor_email: string | null;
  target_email: string | null;
  created_at: string;
}

export function AuditLogsPanel({ canClear }: { canClear: boolean }) {
  const load = useServerFn(listAuditLogs);
  const clear = useServerFn(clearAuditLogs);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");

  const refresh = async () => {
    try {
      setRows((await load()) as unknown as AuditRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load audit logs");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matches =
      !q ||
      r.description.toLowerCase().includes(q) ||
      (r.target_email ?? "").toLowerCase().includes(q) ||
      (r.actor_email ?? "").toLowerCase().includes(q);
    return matches && (action === "all" || r.action === action);
  });

  return (
    <section className="surface p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Audit logs ({filtered.length})</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            className="w-56"
            placeholder="Search activity"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="size-4" aria-hidden /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "audit-logs.csv",
                filtered.map((r) => ({
                  timestamp: r.created_at,
                  action: r.action,
                  description: r.description,
                  actor: r.actor_email ?? "",
                  target: r.target_email ?? "",
                })),
              )
            }
          >
            <Download className="size-4" aria-hidden /> Export
          </Button>
          {canClear && (
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!window.confirm("Clear the entire audit trail?")) return;
                try {
                  await clear();
                  await refresh();
                  toast.success("Audit logs cleared");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not clear logs");
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No activity recorded.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">{r.action.replace(/_/g, " ")}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>{r.actor_email ?? "—"}</TableCell>
                  <TableCell>{r.target_email ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
