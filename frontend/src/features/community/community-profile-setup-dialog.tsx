import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { setupCommunityProfile } from "@/features/community/community-api";
import { CollegeFields } from "@/features/auth/profile-fields";
import { communitySetupFieldsSchema, type CommunitySetupFieldsInput } from "@/features/auth/profile-fields-schema";

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

/** One-time prompt shown the first time a student (new or existing) lands on Community —
 * gated on `user.communityProfileConfigured`, never re-shown once completed. Collects the
 * username (which doubles as the community display name — no separate display name to ask
 * for, see the User model's pre-save hook) plus the college/city details onboarding no longer
 * asks for up front (see onboarding-form.tsx, which only collects name + gender) — deferred
 * here since a student only actually needs them once they try to join their college/city
 * communities. */
export function CommunityProfileSetupDialog() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CommunitySetupFieldsInput>({
    resolver: zodResolver(communitySetupFieldsSchema),
    defaultValues: { college: "", collegeCategoryId: "", city: "" },
  });

  // `user` can still be null on first render (e.g. right after onboarding, before the
  // persisted-user cache is written) — this backfills the auto-generated username once auth
  // resolves, but only while the student hasn't started typing their own choice.
  useEffect(() => {
    if (user?.username && !username) setUsername(user.username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  const open = Boolean(user && !user.communityProfileConfigured);
  const normalizedUsername = username.trim().toLowerCase();

  async function onSubmit(values: CommunitySetupFieldsInput) {
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      toast.error("3-32 characters: letters, numbers, underscore only");
      return;
    }
    setSubmitting(true);
    try {
      await setupCommunityProfile({ ...values, username: normalizedUsername });
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
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Create your community profile</DialogTitle>
          <DialogDescription>A couple more details before you join Community and Chat.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              <p className="text-muted-foreground text-xs">
                This is how other students see you in Community and Chat — never your real name.
              </p>
            </div>

            <CollegeFields form={form} />

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
