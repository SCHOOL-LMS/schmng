import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { School, LogIn, KeyRound, ArrowLeft, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACCESS_LABEL, ROLES, ROLE_META, type Role } from "@/lib/access";
import { getSetupStatus, requestPasswordReset } from "@/lib/admin.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "School Management System — Sign In by Role" },
      {
        name: "description",
        content:
          "Select your role and sign in to the unified School Management Portal. Access is granted by role and access level.",
      },
      { property: "og:title", content: "School Management System — Sign In by Role" },
      {
        property: "og:description",
        content:
          "Role-based entry point to the unified School Management Portal for administrators, staff, students and parents.",
      },
    ],
  }),
  component: Landing,
});

const ACCENT_BAR: Record<Role, string> = {
  super_admin: "bg-role-super",
  school_manager: "bg-role-manager",
  staff: "bg-role-staff",
  student: "bg-role-student",
  parent: "bg-role-parent",
};

const ACCENT_TEXT: Record<Role, string> = {
  super_admin: "text-role-super border-role-super/30 bg-role-super/8",
  school_manager: "text-role-manager border-role-manager/30 bg-role-manager/8",
  staff: "text-role-staff border-role-staff/30 bg-role-staff/8",
  student: "text-role-student border-role-student/30 bg-role-student/8",
  parent: "text-role-parent border-role-parent/30 bg-role-parent/8",
};

function Landing() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [view, setView] = useState<"login" | "forgot">("login");
  const [initialised, setInitialised] = useState<boolean | null>(null);
  const checkSetup = useServerFn(getSetupStatus);

  useEffect(() => {
    void checkSetup().then((s) => setInitialised(s.initialised));
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/portal" });
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-12 text-center">
          <div className="flex items-center gap-3">
            <School className="size-9" aria-hidden />
            <h1 className="text-4xl font-bold sm:text-5xl">School Management System</h1>
          </div>
          <p className="text-ink-muted">Comprehensive Educational Management Platform</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {initialised === false && (
          <div className="surface mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 text-warning" aria-hidden />
              <div>
                <p className="font-semibold">This system has not been set up yet</p>
                <p className="text-sm text-muted-foreground">
                  Create the initial Super Administrator and School Manager accounts to begin.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/setup">Run system setup</Link>
            </Button>
          </div>
        )}

        {!role ? (
          <section aria-labelledby="roles-heading">
            <h2 id="roles-heading" className="sr-only">
              Select your role
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r) => {
                const meta = ROLE_META[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setView("login");
                    }}
                    className="surface group relative overflow-hidden p-7 text-center transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                  >
                    <span
                      className={`absolute inset-x-0 top-0 h-1 ${ACCENT_BAR[r]}`}
                      aria-hidden
                    />
                    <h3 className="text-xl font-semibold">{meta.label}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{meta.tagline}</p>
                    <span
                      className={`mt-5 inline-block rounded-full border px-3 py-1 text-xs font-medium ${ACCENT_TEXT[r]}`}
                    >
                      {ACCESS_LABEL[meta.accessLevel]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground whitespace-pre-wrap">
              {"About Us           Contact Us            Privacy Policy          Terms of Service            AI Assistant            FAQ          Resources "}
            </p>
          </section>
        ) : (
          <AuthPanel role={role} view={view} setView={setView} onBack={() => setRole(null)} />
        )}
      </div>
    </main>
  );
}

function AuthPanel({
  role,
  view,
  setView,
  onBack,
}: {
  role: Role;
  view: "login" | "forgot";
  setView: (v: "login" | "forgot") => void;
  onBack: () => void;
}) {
  const meta = ROLE_META[role];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const raiseReset = useServerFn(requestPasswordReset);
  const stampLogin = useServerFn(recordLogin);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setBusy(false);
      toast.error(error?.message ?? "Sign in failed");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile || profile.status !== "active") {
      await supabase.auth.signOut();
      setBusy(false);
      toast.error("This account is not active. Contact an administrator.");
      return;
    }
    if (profile.role !== role) {
      await supabase.auth.signOut();
      setBusy(false);
      toast.error(`This account is not registered as ${meta.label}.`);
      return;
    }
    try {
      await stampLogin({ data: undefined });
    } catch {
      // non-blocking: login tracking must never prevent access
    }
    navigate({ to: "/portal" });
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await raiseReset({ data: { email, note: note || undefined } });
      toast.success("Request sent. An administrator will reset your password.");
      setView("login");
      setNote("");
    } catch {
      toast.error("Could not send the request. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Choose a different role
      </button>

      <div className="surface relative overflow-hidden p-8">
        <span className={`absolute inset-x-0 top-0 h-1 ${ACCENT_BAR[role]}`} aria-hidden />
        <h2 className="text-2xl font-semibold">{meta.label} sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ACCESS_LABEL[meta.accessLevel]} — {meta.tagline}
        </p>

        {view === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={signIn}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <LogIn className="size-4" aria-hidden /> Sign in
            </Button>
            <button
              type="button"
              onClick={() => setView("forgot")}
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submitReset}>
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Passwords can only be reset by an administrator. Submit a request and your
              administrator will issue a new password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Account email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-note">Message (optional)</Label>
              <Textarea
                id="reset-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <KeyRound className="size-4" aria-hidden /> Send reset request
            </Button>
            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
