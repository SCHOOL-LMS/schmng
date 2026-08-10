import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSetupStatus, runInitialSetup } from "@/lib/admin.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "System Setup — School Management System" },
      {
        name: "description",
        content:
          "One-time setup to create the initial Super Administrator and School Manager accounts for the School Management System.",
      },
      { property: "og:title", content: "System Setup — School Management System" },
      {
        property: "og:description",
        content: "Create the initial Super Administrator and School Manager accounts.",
      },
    ],
  }),
  component: SetupPage,
});

interface AccountForm {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
}

const blank: AccountForm = { fullName: "", email: "", password: "", confirm: "" };

function SetupPage() {
  const navigate = useNavigate();
  const status = useServerFn(getSetupStatus);
  const setup = useServerFn(runInitialSetup);
  const [initialised, setInitialised] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [superAdmin, setSuperAdmin] = useState<AccountForm>(blank);
  const [manager, setManager] = useState<AccountForm>(blank);

  useEffect(() => {
    void status().then((s) => setInitialised(s.initialised));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [label, form] of [
      ["Super Administrator", superAdmin],
      ["School Manager", manager],
    ] as const) {
      if (form.password.length < 8) {
        toast.error(`${label}: password must be 8+ characters.`);
        return;
      }
      if (form.password !== form.confirm) {
        toast.error(`${label}: passwords do not match.`);
        return;
      }
    }
    if (superAdmin.email.trim().toLowerCase() === manager.email.trim().toLowerCase()) {
      toast.error("The two accounts must use different email addresses.");
      return;
    }
    setBusy(true);
    try {
      await setup({
        data: {
          superAdmin: {
            fullName: superAdmin.fullName,
            email: superAdmin.email.trim(),
            password: superAdmin.password,
          },
          schoolManager: {
            fullName: manager.fullName,
            email: manager.email.trim(),
            password: manager.password,
          },
        },
      });
      setDone(true);
      toast.success("Initial accounts created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  };

  if (initialised) {
    return (
      <Shell>
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-semibold">Setup already completed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This system has already been initialised. Further accounts are created by a Super
            Admin inside User Management.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
            Go to sign in
          </Button>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="surface p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold">System ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The Super Administrator and School Manager accounts have been created. Sign in from
            the landing page using the matching role card.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/">Go to sign in</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form className="space-y-6" onSubmit={submit}>
        <AccountFields
          title="Super Administrator"
          hint="Full system access — the only role that can create administrator accounts."
          value={superAdmin}
          onChange={setSuperAdmin}
          idPrefix="sa"
        />
        <AccountFields
          title="School Manager"
          hint="Administrator access for registrar and finance operations."
          value={manager}
          onChange={setManager}
          idPrefix="sm"
        />
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          Create initial accounts
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-10">
          <ShieldCheck className="size-8" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold">System Setup</h1>
            <p className="text-sm text-ink-muted">
              One-time creation of the initial administrator accounts
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">{children}</div>
    </main>
  );
}

function AccountFields({
  title,
  hint,
  value,
  onChange,
  idPrefix,
}: {
  title: string;
  hint: string;
  value: AccountForm;
  onChange: (v: AccountForm) => void;
  idPrefix: string;
}) {
  const set = (k: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <section className="surface p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-name`}>Full name</Label>
          <Input id={`${idPrefix}-name`} required value={value.fullName} onChange={set("fullName")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            required
            value={value.email}
            onChange={set("email")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-pass`}>Password</Label>
          <Input
            id={`${idPrefix}-pass`}
            type="password"
            required
            minLength={8}
            value={value.password}
            onChange={set("password")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-confirm`}>Confirm password</Label>
          <Input
            id={`${idPrefix}-confirm`}
            type="password"
            required
            minLength={8}
            value={value.confirm}
            onChange={set("confirm")}
          />
        </div>
      </div>
    </section>
  );
}
