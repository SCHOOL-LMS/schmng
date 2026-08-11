import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  forcePasswordChangeAll,
  getSecuritySettings,
  lockAllAccounts,
  saveSecuritySettings,
} from "@/lib/admin.functions";

interface Settings {
  allowedIps: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  maxConcurrentSessions: number;
}

const DEFAULTS: Settings = {
  allowedIps: "",
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  sessionTimeout: 60,
  maxConcurrentSessions: 3,
};

export function SecuritySettingsPanel({ canEdit }: { canEdit: boolean }) {
  const load = useServerFn(getSecuritySettings);
  const save = useServerFn(saveSecuritySettings);
  const forceChange = useServerFn(forcePasswordChangeAll);
  const lockAll = useServerFn(lockAllAccounts);

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load()
      .then((row) => {
        if (!row) return;
        setSettings({
          allowedIps: row.allowed_ips ?? "",
          maxLoginAttempts: row.max_login_attempts,
          lockoutDuration: row.lockout_duration,
          sessionTimeout: row.session_timeout,
          maxConcurrentSessions: row.max_concurrent_sessions,
        });
      })
      .catch(() => toast.error("Could not load security settings"));
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: settings });
      toast.success("Security settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="surface space-y-6 p-6" onSubmit={submit}>
        <div>
          <h2 className="text-lg font-semibold">IP address restrictions</h2>
          <p className="text-sm text-muted-foreground">
            One address or CIDR range per line. Leave empty to allow all.
          </p>
        </div>
        <Textarea
          rows={4}
          disabled={!canEdit}
          value={settings.allowedIps}
          onChange={(e) => set("allowedIps", e.target.value)}
          placeholder="192.168.1.0/24"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ss-attempts">Max login attempts</Label>
            <Input
              id="ss-attempts"
              type="number"
              min={1}
              max={10}
              disabled={!canEdit}
              value={settings.maxLoginAttempts}
              onChange={(e) => set("maxLoginAttempts", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ss-lockout">Lockout duration (minutes)</Label>
            <Input
              id="ss-lockout"
              type="number"
              min={5}
              max={1440}
              disabled={!canEdit}
              value={settings.lockoutDuration}
              onChange={(e) => set("lockoutDuration", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ss-timeout">Session timeout (minutes)</Label>
            <Input
              id="ss-timeout"
              type="number"
              min={5}
              max={480}
              disabled={!canEdit}
              value={settings.sessionTimeout}
              onChange={(e) => set("sessionTimeout", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ss-sessions">Max concurrent sessions</Label>
            <Input
              id="ss-sessions"
              type="number"
              min={1}
              max={10}
              disabled={!canEdit}
              value={settings.maxConcurrentSessions}
              onChange={(e) => set("maxConcurrentSessions", Number(e.target.value))}
            />
          </div>
        </div>

        <Button type="submit" disabled={!canEdit || busy}>
          <Save className="size-4" aria-hidden /> Save settings
        </Button>
      </form>

      <section className="surface p-6">
        <div className="mb-1 flex items-center gap-2">
          <ShieldAlert className="size-5 text-warning" aria-hidden />
          <h2 className="text-lg font-semibold">Emergency actions</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          These apply to every account except your own. Super Admin only.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={!canEdit}
            onClick={async () => {
              if (!window.confirm("Force a password change for all other accounts?")) return;
              try {
                const r = await forceChange();
                toast.success(`Password change forced for ${r.affected} accounts`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Action failed");
              }
            }}
          >
            <RotateCcw className="size-4" aria-hidden /> Force password change
          </Button>
          <Button
            variant="destructive"
            disabled={!canEdit}
            onClick={async () => {
              if (!window.confirm("Suspend all other accounts immediately?")) return;
              try {
                const r = await lockAll();
                toast.success(`${r.affected} accounts suspended`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Action failed");
              }
            }}
          >
            <Lock className="size-4" aria-hidden /> Lock all accounts
          </Button>
        </div>
      </section>
    </div>
  );
}
