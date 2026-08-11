import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Download,
  KeyRound,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  adminResetPassword,
  bulkImportAccounts,
  createAccount,
  deleteAccount,
  listAccounts,
  listResetRequests,
  setAccountStatus,
  updateAccount,
} from "@/lib/admin.functions";
import { ACCESS_LABEL, ROLES, ROLE_META, type Role } from "@/lib/access";
import { useSession } from "@/hooks/useSession";
import { downloadCsv, generateSecurePassword, STATUSES } from "@/lib/user-management";
import { AuditLogsPanel } from "./AuditLogsPanel";
import { SecuritySettingsPanel } from "./SecuritySettingsPanel";
import { UserFormDialog, type AccountRow, type UserFormValues } from "./UserFormDialog";

interface ResetRow {
  id: string;
  email: string;
  note: string | null;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  active: "border-success/30 bg-success/10 text-success",
  suspended: "border-warning/40 bg-warning/10 text-warning",
  inactive: "border-border bg-muted text-muted-foreground",
};

export function UserManagement() {
  const { profile } = useSession();
  const isSuperAdmin = profile?.role === "super_admin";

  const fetchAccounts = useServerFn(listAccounts);
  const fetchRequests = useServerFn(listResetRequests);
  const addAccount = useServerFn(createAccount);
  const editAccount = useServerFn(updateAccount);
  const changeStatus = useServerFn(setAccountStatus);
  const removeAccount = useServerFn(deleteAccount);
  const resetPassword = useServerFn(adminResetPassword);
  const importAccounts = useServerFn(bulkImportAccounts);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [requests, setRequests] = useState<ResetRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      const matches =
        !q ||
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.username ?? "").toLowerCase().includes(q);
      return (
        matches &&
        (roleFilter === "all" || a.role === roleFilter) &&
        (statusFilter === "all" || a.status === statusFilter)
      );
    });
  }, [accounts, search, roleFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: accounts.length,
      active: accounts.filter((a) => a.status === "active").length,
      suspended: accounts.filter((a) => a.status === "suspended").length,
      admins: accounts.filter(
        (a) => a.role === "super_admin" || a.role === "school_manager",
      ).length,
    }),
    [accounts],
  );

  const submitForm = async (values: UserFormValues) => {
    setBusy(true);
    try {
      if (editing) {
        await editAccount({
          data: {
            userId: editing.id,
            fullName: values.fullName,
            email: values.email.trim(),
            username: values.username || null,
            gender: values.gender || null,
            role: values.role,
            accessLevel: values.accessLevel,
            department: values.department || null,
            className: values.className || null,
            status: values.status as "active",
            twoFactorEnabled: values.twoFactorEnabled,
            permissions: values.permissions,
          },
        });
        if (values.password) {
          await resetPassword({ data: { userId: editing.id, password: values.password } });
        }
        toast.success("User updated");
      } else {
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
          },
        });
        toast.success("Account created");
      }
      setDialogOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the user");
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (row: AccountRow) => {
    const suggested = generateSecurePassword();
    const password = window.prompt(
      `New password for ${row.email} (min 8 characters)`,
      suggested,
    );
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

  const toggleStatus = async (row: AccountRow) => {
    const next = row.status === "active" ? "suspended" : "active";
    try {
      await changeStatus({ data: { userId: row.id, status: next } });
      toast.success(`Account ${next}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change status");
    }
  };

  const doDelete = async (row: AccountRow) => {
    if (!window.confirm(`Permanently delete ${row.email}? This cannot be undone.`)) return;
    try {
      await removeAccount({ data: { userId: row.id } });
      toast.success("Account deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the account");
    }
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const headers = (lines.shift() ?? "").split(",").map((h) => h.trim().toLowerCase());
    const users = lines
      .filter(Boolean)
      .map((line) => {
        const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const get = (name: string) => cells[headers.indexOf(name)] ?? "";
        return {
          fullName: get("full_name") || get("name"),
          email: get("email"),
          role: (get("role") || "student") as Role,
          password: get("password") || generateSecurePassword(),
          username: get("username") || undefined,
          department: get("department") || undefined,
          className: get("class") || get("class_name") || undefined,
        };
      })
      .filter((u) => u.email && u.fullName);

    if (users.length === 0) {
      toast.error("No valid rows found. Expected headers: full_name, email, role.");
      return;
    }
    try {
      const result = await importAccounts({ data: { users } });
      toast.success(`${result.created} accounts imported`);
      if (result.failed.length > 0) toast.error(result.failed.slice(0, 3).join(" | "));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  return (
    <Tabs defaultValue="users" className="space-y-6">
      <TabsList>
        <TabsTrigger value="users">User management</TabsTrigger>
        <TabsTrigger value="security">Security settings</TabsTrigger>
        <TabsTrigger value="audit">Audit logs</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total users", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Suspended", value: stats.suspended },
            { label: "Administrators", value: stats.admins },
          ].map((s) => (
            <div key={s.label} className="surface p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <section className="surface p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Accounts ({filtered.length})</h2>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Input
                className="w-56"
                placeholder="Search name, email, username"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_META[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="size-4" aria-hidden /> Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    "users.csv",
                    filtered.map((a) => ({
                      full_name: a.full_name,
                      email: a.email,
                      username: a.username ?? "",
                      role: a.role,
                      access_level: a.access_level,
                      department: a.department ?? "",
                      class_name: a.class_name ?? "",
                      status: a.status,
                      last_login: a.last_login ?? "",
                    })),
                  )
                }
              >
                <Download className="size-4" aria-hidden /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" aria-hidden /> Import CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void handleImport(file);
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <UserPlus className="size-4" aria-hidden /> Add user
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access level</TableHead>
                  <TableHead>Department / Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No users match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.full_name}
                        {row.username && (
                          <span className="block text-xs text-muted-foreground">
                            @{row.username}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{ROLE_META[row.role]?.label ?? row.role}</TableCell>
                      <TableCell>{ACCESS_LABEL[row.access_level]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.class_name || row.department || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs capitalize ${
                            STATUS_STYLE[row.status] ?? STATUS_STYLE["inactive"]
                          }`}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.last_login ? new Date(row.last_login).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Edit"
                            onClick={() => {
                              setEditing(row);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden />
                            <span className="sr-only">Edit {row.full_name}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Reset password"
                            onClick={() => void doReset(row)}
                          >
                            <KeyRound className="size-4" aria-hidden />
                            <span className="sr-only">Reset password for {row.full_name}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title={row.status === "active" ? "Suspend" : "Activate"}
                            onClick={() => void toggleStatus(row)}
                          >
                            <Power className="size-4" aria-hidden />
                            <span className="sr-only">Toggle status for {row.full_name}</span>
                          </Button>
                          {isSuperAdmin && row.id !== profile?.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              title="Delete"
                              onClick={() => void doDelete(row)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              <span className="sr-only">Delete {row.full_name}</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettingsPanel canEdit={isSuperAdmin} />
      </TabsContent>

      <TabsContent value="audit">
        <AuditLogsPanel canClear={isSuperAdmin} />
      </TabsContent>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditing(null);
        }}
        account={editing}
        busy={busy}
        onSubmit={submitForm}
      />
    </Tabs>
  );
}
