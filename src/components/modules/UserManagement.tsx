import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, UserPlus, RefreshCw } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminResetPassword,
  createAccount,
  listAccounts,
  listResetRequests,
} from "@/lib/admin.functions";
import { ACCESS_LABEL, ROLES, ROLE_META, type AccessLevel, type Role } from "@/lib/access";

interface AccountRow {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  access_level: AccessLevel;
  status: string;
  last_login: string | null;
}

interface ResetRow {
  id: string;
  email: string;
  note: string | null;
  status: string;
  created_at: string;
}

export function UserManagement() {
  const fetchAccounts = useServerFn(listAccounts);
  const fetchRequests = useServerFn(listResetRequests);
  const addAccount = useServerFn(createAccount);
  const resetPassword = useServerFn(adminResetPassword);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [requests, setRequests] = useState<ResetRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student" as Role,
  });

  const load = async () => {
    try {
      const [a, r] = await Promise.all([fetchAccounts(), fetchRequests()]);
      setAccounts(a as unknown as AccountRow[]);
      setRequests(r as unknown as ResetRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load accounts");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addAccount({ data: { ...form, email: form.email.trim() } });
      toast.success("Account created");
      setForm({ fullName: "", email: "", password: "", role: "student" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (row: AccountRow) => {
    const password = window.prompt(`New password for ${row.email} (min 8 characters)`);
    if (!password) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      await resetPassword({ data: { userId: row.id, password } });
      toast.success("Password reset. Share it with the user securely.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="mb-1 text-lg font-semibold">Create account</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          There is no self sign-up. Every account is issued here.
        </p>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="um-name">Full name</Label>
            <Input
              id="um-name"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-email">Email</Label>
            <Input
              id="um-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-pass">Temporary password</Label>
            <Input
              id="um-pass"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-role">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as Role })}
            >
              <SelectTrigger id="um-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_META[r].label} — {ACCESS_LABEL[ROLE_META[r].accessLevel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              <UserPlus className="size-4" aria-hidden /> Create account
            </Button>
          </div>
        </form>
      </section>

      <section className="surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Accounts ({accounts.length})</h2>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="size-4" aria-hidden /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{ROLE_META[row.role]?.label ?? row.role}</TableCell>
                  <TableCell>{ACCESS_LABEL[row.access_level]}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => void doReset(row)}>
                      <KeyRound className="size-4" aria-hidden /> Reset
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="mb-4 text-lg font-semibold">Password reset requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests.</p>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="font-medium">{r.email}</span>
                <span className="text-muted-foreground">{r.note}</span>
                <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                  {r.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
