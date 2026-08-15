import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Lock, Construction } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { canAccess, getModule } from "@/lib/access";
import { UserManagement } from "@/components/modules/UserManagement";

export const Route = createFileRoute("/_authenticated/portal/$moduleId")({
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = useParams({ from: "/_authenticated/portal/$moduleId" });
  const { profile } = useSession();
  const mod = getModule(moduleId);

  if (!profile) return null;

  if (!mod) {
    return (
      <Panel title="Unknown module">
        <p className="text-sm text-muted-foreground">
          No module is registered under “{moduleId}”.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/portal">Back to portal</Link>
        </Button>
      </Panel>
    );
  }

  if (!canAccess(profile.role, profile.access_level, mod.id)) {
    return (
      <Panel title="Access denied">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-5 text-destructive" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Your access level does not include <strong>{mod.name}</strong>. Contact an
            administrator if you believe this is an error.
          </p>
        </div>
        <Button className="mt-4" asChild>
          <Link to="/portal">Back to portal</Link>
        </Button>
      </Panel>
    );
  }

  const Icon = mod.icon;

  return (
    <div className="space-y-6">
      <header className="surface flex items-start gap-4 p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {mod.category}
          </p>
          <h1 className="text-2xl font-bold">{mod.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
        </div>
      </header>

      {mod.id === "user-management" ? (
        <UserManagement />
      ) : (
        <Panel title="Module placeholder">
          <div className="flex items-start gap-3">
            <Construction className="mt-0.5 size-5 text-warning" aria-hidden />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                The <strong>{mod.name}</strong> module is registered in the portal and reserved
                for you at <code className="rounded bg-muted px-1">/portal/{mod.id}</code>.
              </p>
              <p>
                Drop the module implementation in and it will inherit the portal shell,
                navigation and the role/access-level rules already configured — no routing or
                permission wiring required.
              </p>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Meta label="Module ID" value={mod.id} />
            <Meta label="Permitted roles" value={mod.roles.length.toString() + " of 5"} />
          </dl>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-6">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
