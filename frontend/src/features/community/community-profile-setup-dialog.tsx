import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { setupCommunityProfile } from "@/features/community/community-api";

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

/** One-time prompt shown the first time a student (new or existing) lands on Community —
 * gated on `user.communityProfileConfigured`, never re-shown once they've confirmed a username.
 * The username IS the community display name (see backend User model), so this asks for
 * nothing else — no separate display name. Pre-filled with the auto-generated username so most
 * students can just tap Continue. */
export function CommunityProfileSetupDialog() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [submitting, setSubmitting] = useState(false);

  // `user` can still be null on first render (e.g. right after onboarding, before the
  // persisted-user cache is written) — this backfills the auto-generated username once auth
  // resolves, but only while the student hasn't started typing their own choice.
  useEffect(() => {
    if (user?.username && !username) setUsername(user.username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  const open = Boolean(user && !user.communityProfileConfigured);
  const normalized = username.trim().toLowerCase();
  const valid = USERNAME_PATTERN.test(normalized);

  async function handleSubmit() {
    if (!valid) {
      toast.error("3-32 characters: letters, numbers, underscore only");
      return;
    }
    setSubmitting(true);
    try {
      await setupCommunityProfile({ username: normalized });
      await refreshUser();
      toast.success("Community profile created");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create community profile");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>
            This is how other students see you in Community and Chat — never your real name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-username-input">Username</Label>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              @
            </span>
            <Input
              id="setup-username-input"
              className="pl-7"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
