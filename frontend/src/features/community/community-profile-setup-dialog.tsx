import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { setupCommunityProfile } from "@/features/community/community-api";

/** One-time prompt shown the first time a student (new or existing) lands on Community —
 * gated on `user.communityProfileConfigured`, never re-shown once they've chosen a name.
 * Deliberately asks nothing else (no bio/interests/hobbies): just the community display name. */
export function CommunityProfileSetupDialog() {
  const { user, refreshUser } = useAuth();
  const [choice, setChoice] = useState<"original" | "custom">("original");
  const [customName, setCustomName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = Boolean(user && !user.communityProfileConfigured);

  async function handleSubmit() {
    if (choice === "custom" && customName.trim().length === 0) {
      toast.error("Enter a name");
      return;
    }
    setSubmitting(true);
    try {
      await setupCommunityProfile({
        useOriginalName: choice === "original",
        displayName: choice === "custom" ? customName.trim() : undefined,
      });
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
          <DialogTitle>Create your community profile</DialogTitle>
          <DialogDescription>How should other students see you in Community and Chat?</DialogDescription>
        </DialogHeader>

        <RadioGroup value={choice} onValueChange={(value) => setChoice(value as "original" | "custom")}>
          <label className="border-border/70 flex cursor-pointer items-center gap-3 rounded-xl border p-3">
            <RadioGroupItem value="original" id="setup-original-name" />
            <span className="text-sm">
              Use my name{user.name ? ` — "${user.name}"` : ""}
            </span>
          </label>
          <label className="border-border/70 flex cursor-pointer items-center gap-3 rounded-xl border p-3">
            <RadioGroupItem value="custom" id="setup-custom-name" />
            <span className="text-sm">Use a different name</span>
          </label>
        </RadioGroup>

        {choice === "custom" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setup-custom-name-input">Community name</Label>
            <Input
              id="setup-custom-name-input"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="How you'd like to appear"
              maxLength={40}
              autoFocus
            />
          </div>
        )}

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
