import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { ACCESS_LABEL, MODULE_CATEGORIES, ROLE_META, modulesForRole } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: PortalHome,
});

function PortalHome() {
  const { profile } = useSession();
  if (!profile) return null;

  const meta = ROLE_META[profile.role];
  const modules = modulesForRole(profile.role).filter((m) => m.id !== "dashboard");

  return (
    <div className="space-y-6">
      <section className="surface overflow-hidden">
        <div className="bg-ink px-6 py-7 text-ink-foreground">
          <h1 className="text-2xl font-bold">
            Welcome, {profile.full_name || profile.email}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            This is your centralized portal. Everything you are permitted to use lives here.
          </p>
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-3">
          <Stat label="Role" value={meta.label} />
          <Stat label="Access level" value={ACCESS_LABEL[profile.access_level]} />
          <Stat label="Available modules" value={String(modules.length + 1)} />
        </dl>
      </section>

      {MODULE_CATEGORIES.map((category) => {
        const items = modules.filter((m) => m.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`cat-${category}`}>
            <h2 id={`cat-${category}`} className="mb-3 text-lg font-semibold">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.id}
                    to="/portal/$moduleId"
                    params={{ moduleId: m.id }}
                    className="surface group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-sm text-muted-foreground">{m.description}</span>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-6 py-5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
