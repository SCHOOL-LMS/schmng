import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Bell, History, Search } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Input } from "@/components/ui/input";
import { ACCESS_LABEL, MODULE_CATEGORIES, ROLE_META, modulesFor } from "@/lib/access";
import { getPortalOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: PortalHome,
});

const QUICK_ACTION_IDS = [
  "results",
  "admissions",
  "attendance",
  "fees-invoicing",
  "messaging",
  "user-management",
];

function PortalHome() {
  const { profile } = useSession();
  const overviewFn = useServerFn(getPortalOverview);
  const { data: overview } = useQuery({
    queryKey: ["portal-overview"],
    queryFn: () => overviewFn(),
    enabled: !!profile,
    staleTime: 60_000,
  });
  const [query, setQuery] = useState("");

  const available = useMemo(
    () => (profile ? modulesFor(profile.role, profile.access_level) : []),
    [profile],
  );

  if (!profile) return null;

  const meta = ROLE_META[profile.role];
  const modules = available.filter((m) => m.id !== "dashboard");
  const term = query.trim().toLowerCase();
  const matches = term
    ? modules.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term),
      )
    : modules;
  const quickActions = modules.filter((m) => QUICK_ACTION_IDS.includes(m.id)).slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="surface overflow-hidden">
        <div className="bg-ink px-6 py-7 text-ink-foreground">
          <h1 className="text-2xl font-bold">Welcome, {profile.full_name || profile.email}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            This is your centralized portal. Everything you are permitted to use lives here.
          </p>
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-3">
          <Stat label="Role" value={meta.label} />
          <Stat label="Access level" value={ACCESS_LABEL[profile.access_level]} />
          <Stat label="Available modules" value={String(available.length)} />
        </dl>
      </section>

      <div className="surface flex items-center gap-3 p-3">
        <Search className="ml-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your modules…"
          aria-label="Search modules"
          className="border-0 shadow-none focus-visible:ring-0"
        />
        {term && (
          <span className="shrink-0 pr-2 text-xs text-muted-foreground">
            {matches.length} match{matches.length === 1 ? "" : "es"}
          </span>
        )}
      </div>

      {quickActions.length > 0 && !term && (
        <section aria-labelledby="quick-actions">
          <h2 id="quick-actions" className="mb-3 text-lg font-semibold">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.id}
                  to="/portal/$moduleId"
                  params={{ moduleId: m.id }}
                  className="surface flex items-center gap-3 p-4 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {m.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {term ? (
        <ModuleGrid modules={matches} emptyLabel="No module matches that search." />
      ) : (
        MODULE_CATEGORIES.map((category) => {
          const items = modules.filter((m) => m.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category} aria-labelledby={`cat-${category}`}>
              <h2 id={`cat-${category}`} className="mb-3 text-lg font-semibold">
                {category}
              </h2>
              <ModuleGrid modules={items} />
            </section>
          );
        })
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="recent-activity">
          <h2 id="recent-activity" className="flex items-center gap-2 text-lg font-semibold">
            <History className="size-4 text-primary" aria-hidden /> Recent activity
          </h2>
          <ul className="mt-3 space-y-3">
            {(overview?.activity ?? []).map((entry) => (
              <li key={entry.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-sm">{entry.description}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.actor_email ? `${entry.actor_email} · ` : ""}
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </li>
            ))}
            {(overview?.activity.length ?? 0) === 0 && (
              <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
            )}
          </ul>
        </section>

        <section className="surface p-5" aria-labelledby="notifications">
          <h2 id="notifications" className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="size-4 text-primary" aria-hidden /> Notifications
          </h2>
          {overview?.isAdmin && overview.pendingResets > 0 ? (
            <Link
              to="/portal/$moduleId"
              params={{ moduleId: "user-management" }}
              className="mt-3 flex items-center justify-between rounded-md bg-warning/10 p-3 text-sm"
            >
              <span>
                {overview.pendingResets} password reset request
                {overview.pendingResets === 1 ? "" : "s"} awaiting review
              </span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">You have no new notifications.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function ModuleGrid({
  modules,
  emptyLabel,
}: {
  modules: ReturnType<typeof modulesFor>;
  emptyLabel?: string;
}) {
  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel ?? "Nothing here yet."}</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => {
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
