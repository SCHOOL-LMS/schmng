import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ACCESS_LABEL, ROLE_META, ROLES, type AccessLevel, type Role } from "@/lib/access";
import { POSITIONS } from "@/lib/staff";
import {
  ACCESS_DESCRIPTION,
  CLASSES,
  DEFAULT_PERMISSIONS,
  DEPARTMENTS,
  GENDERS,
  PERMISSIONS,
  STATUSES,
  type PermissionId,
} from "@/lib/user-management";

export interface AccountRow {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  role: Role;
  access_level: AccessLevel;
  status: string;
  gender: string | null;
  department: string | null;
  class_name: string | null;
  two_factor_enabled: boolean;
  permissions: PermissionId[] | null;
  force_password_change: boolean;
  phone: string | null;
  position: string | null;
  employee_id: string | null;
  admission_number?: string | null;
  salary: number | null;
  start_date: string | null;
  last_login: string | null;
  created_at: string;
}

export interface UserFormValues {
  fullName: string;
  email: string;
  username: string;
  gender: string;
  role: Role;
  accessLevel: AccessLevel;
  department: string;
  className: string;
  status: string;
  password: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  permissions: PermissionId[];
  phone: string;
  position: string;
  salary: string;
  startDate: string;
}

const PAYROLL_ROLES: Role[] = ["staff", "school_manager"];

const LEVELS: AccessLevel[] = ["super_administrator", "administrator", "standard", "basic"];

function emptyForm(): UserFormValues {
  return {
    fullName: "",
    email: "",
    username: "",
    gender: "",
    role: "student",
    accessLevel: "basic",
    department: "",
    className: "",
    status: "active",
    password: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    permissions: [...DEFAULT_PERMISSIONS.basic],
    phone: "",
    position: "",
    salary: "",
    startDate: "",
  };
}

function fromAccount(a: AccountRow): UserFormValues {
  return {
    fullName: a.full_name,
    email: a.email,
    username: a.username ?? "",
    gender: a.gender ?? "",
    role: a.role,
    accessLevel: a.access_level,
    department: a.department ?? "",
    className: a.class_name ?? "",
    status: a.status,
    password: "",
    confirmPassword: "",
    twoFactorEnabled: a.two_factor_enabled,
    permissions: a.permissions ?? [...DEFAULT_PERMISSIONS[a.access_level]],
    phone: a.phone ?? "",
    position: a.position ?? "",
    salary: a.salary != null ? String(a.salary) : "",
    startDate: a.start_date ?? "",
  };
}

export function UserFormDialog({
  open,
  onOpenChange,
  account,
  busy,
  onSubmit,
  defaultRole,
  suggestedPassword,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: AccountRow | null;
  busy: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
  defaultRole?: Role;
  suggestedPassword?: string;
}) {
  const editing = Boolean(account);
  const [form, setForm] = useState<UserFormValues>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (account) {
      setForm(fromAccount(account));
      return;
    }
    const base = emptyForm();
    if (defaultRole) {
      const level = ROLE_META[defaultRole].accessLevel;
      base.role = defaultRole;
      base.accessLevel = level;
      base.permissions = [...DEFAULT_PERMISSIONS[level]];
    }
    if (suggestedPassword) {
      base.password = suggestedPassword;
      base.confirmPassword = suggestedPassword;
    }
    setForm(base);
  }, [open, account, defaultRole, suggestedPassword]);

  const set = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const changeRole = (role: Role) => {
    const level = ROLE_META[role].accessLevel;
    setForm((f) => ({
      ...f,
      role,
      accessLevel: level,
      permissions: [...DEFAULT_PERMISSIONS[level]],
      className: role === "student" ? f.className : "",
    }));
  };

  const changeLevel = (accessLevel: AccessLevel) =>
    setForm((f) => ({ ...f, accessLevel, permissions: [...DEFAULT_PERMISSIONS[accessLevel]] }));

  const togglePermission = (id: PermissionId, on: boolean) =>
    setForm((f) => ({
      ...f,
      permissions: on ? [...f.permissions, id] : f.permissions.filter((p) => p !== id),
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (PAYROLL_ROLES.includes(form.role)) {
      const salary = Number(form.salary);
      if (!form.salary || !Number.isFinite(salary) || salary <= 0) {
        setError("Salary is required for staff and school manager accounts.");
        return;
      }
    }
    if (!editing || form.password) {
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "Add new user"}</DialogTitle>
          <DialogDescription>
            Accounts are issued by administrators only — there is no self sign-up.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="uf-name">Full name</Label>
            <Input
              id="uf-name"
              required
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-username">Username</Label>
            <Input
              id="uf-username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-email">Email</Label>
            <Input
              id="uf-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-gender">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger id="uf-gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf-role">Role</Label>
            <Select value={form.role} onValueChange={(v) => changeRole(v as Role)}>
              <SelectTrigger id="uf-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-level">Access level</Label>
            <Select value={form.accessLevel} onValueChange={(v) => changeLevel(v as AccessLevel)}>
              <SelectTrigger id="uf-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {ACCESS_LABEL[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="uf-desc">Access description</Label>
            <Textarea id="uf-desc" rows={2} readOnly value={ACCESS_DESCRIPTION[form.accessLevel]} />
          </div>

          {form.role === "student" && (
            <div className="space-y-2">
              <Label htmlFor="uf-class">Class</Label>
              <Select value={form.className} onValueChange={(v) => set("className", v)}>
                <SelectTrigger id="uf-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="uf-phone">Phone number</Label>
            <Input
              id="uf-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {PAYROLL_ROLES.includes(form.role) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="uf-position">Position</Label>
                <Select value={form.position} onValueChange={(v) => set("position", v)}>
                  <SelectTrigger id="uf-position">
                    <SelectValue placeholder="Select position" />
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
                <Label htmlFor="uf-salary">Salary (GHS)</Label>
                <Input
                  id="uf-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.salary}
                  onChange={(e) => set("salary", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf-start">Start date</Label>
                <Input
                  id="uf-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf-empid">Employee ID</Label>
                <Input
                  id="uf-empid"
                  readOnly
                  value={account?.employee_id ?? "Generated automatically on save"}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="uf-dept">Department</Label>
            <Select value={form.department} onValueChange={(v) => set("department", v)}>
              <SelectTrigger id="uf-dept">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {editing && (
            <div className="space-y-2">
              <Label htmlFor="uf-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger id="uf-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="uf-pass">{editing ? "New password (optional)" : "Password"}</Label>
            <Input
              id="uf-pass"
              type="password"
              autoComplete="new-password"
              required={!editing}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf-pass2">Confirm password</Label>
            <Input
              id="uf-pass2"
              type="password"
              autoComplete="new-password"
              required={!editing}
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">
                Require a second factor when this user signs in.
              </p>
            </div>
            <Switch
              checked={form.twoFactorEnabled}
              onCheckedChange={(v) => set("twoFactorEnabled", v)}
            />
          </div>

          <fieldset className="rounded-md border border-border p-4 sm:col-span-2">
            <legend className="px-1 text-sm font-medium">
              Permissions — {ACCESS_LABEL[form.accessLevel]}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {PERMISSIONS.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.permissions.includes(p.id)}
                    onCheckedChange={(v) => togglePermission(p.id, v === true)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {editing ? "Update user" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
