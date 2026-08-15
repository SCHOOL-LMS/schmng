import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPassword } from "@/lib/admin.functions";

/**
 * Shown when an administrator has reset a user's password. The user cannot
 * reach any module until they set a password of their own.
 */
export function ForcePasswordChange({
  onDone,
  onSignOut,
}: {
  onDone: () => Promise<void> | void;
  onSignOut: () => Promise<void> | void;
}) {
  const change = useServerFn(changeOwnPassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await change({ data: { password } });
      toast.success("Password updated.");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="surface w-full max-w-md p-8">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An administrator reset your password. Choose a new one to continue into the portal.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Update password
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void onSignOut()}>
            <LogOut className="size-4" aria-hidden /> Sign out instead
          </Button>
        </form>
      </div>
    </div>
  );
}
