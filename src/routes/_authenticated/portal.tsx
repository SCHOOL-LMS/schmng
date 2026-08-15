import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { School, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { ACCESS_LABEL, MODULE_CATEGORIES, ROLE_META, modulesFor } from "@/lib/access";
import { getPortalOverview } from "@/lib/admin.functions";
import { ForcePasswordChange } from "@/components/portal/ForcePasswordChange";
import { useIdleLogout } from "@/hooks/useIdleLogout";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "School Management Portal — Unified Dashboard" },
      {
        name: "description",
        content:
          "The centralized School Management Portal. Every module you can access, in one place, based on your role and access level.",
      },
      { property: "og:title", content: "School Management Portal — Unified Dashboard" },
      {
        property: "og:description",
        content: "Centralized portal for all school modules, filtered by role and access level.",
      },
    ],
  }),
  component: PortalLayout,
});

function PortalLayout() {
  const { profile, loading, refresh } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const overviewFn = useServerFn(getPortalOverview);
  const { data: overview } = useQuery({
    queryKey: ["portal-overview"],
    queryFn: () => overviewFn(),
    enabled: !!profile,
    staleTime: 60_000,
  });

  const signOut = async (message?: string) => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    if (message) toast.info(message);
    navigate({ to: "/", replace: true });
  };

  useIdleLogout(overview?.sessionTimeout ?? 0, () => {
    void signOut("You were signed out after a period of inactivity.");
  });

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading your portal…
      </div>
    );
  }

  // An account suspended while signed in loses access immediately.
  if (profile.status !== "active") {
    void signOut("This account is no longer active. Contact an administrator.");
    return null;
  }

  if (profile.force_password_change) {
    return (
      <ForcePasswordChange onDone={() => refresh()} onSignOut={() => signOut()} />
    );
  }

  const meta = ROLE_META[profile.role];
  const modules = modulesFor(profile.role, profile.access_level);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-ink-foreground hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle module menu"
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <Link to="/portal" className="flex items-center gap-2.5">
            <School className="size-6" aria-hidden />
            <span className="text-lg font-semibold">School Management Portal</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
              <p className="text-xs text-ink-muted">
                {meta.label} · {ACCESS_LABEL[profile.access_level]}
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-ink-foreground hover:bg-white/10"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" aria-hidden /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        <aside
          className={`${open ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-64`}
          aria-label="Modules"
        >
          <nav className="surface sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {modules.length} modules available
            </p>
            {MODULE_CATEGORIES.map((category) => {
              const items = modules.filter((m) => m.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="mb-3">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </p>
                  {items.map((m) => {
                    const to = m.id === "dashboard" ? "/portal" : `/portal/${m.id}`;
                    const active = pathname === to;
                    const Icon = m.icon;
                    return (
                      <Link
                        key={m.id}
                        to={m.id === "dashboard" ? "/portal" : "/portal/$moduleId"}
                        params={m.id === "dashboard" ? {} : { moduleId: m.id }}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition ${
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {m.name}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className={`${open ? "hidden" : "block"} min-w-0 flex-1 lg:block`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
