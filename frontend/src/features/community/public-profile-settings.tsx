import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { updatePublicProfile } from "@/features/community/community-api";
import { AvatarUploadField } from "@/features/auth/avatar-upload-field";

/** Community/chat's public identity is just a photo and a display name — never the real
 * name, mobile, city/college (those live in the account profile form above), and no
 * username/bio/interests either, to keep this a one-field-plus-photo edit. */
export function PublicProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setDisplayName(user.displayName ?? "");
    setAvatar(user.avatar ?? "");
  }, [open, user]);

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error("Enter a display name");
      return;
    }
    setSaving(true);
    try {
      await updatePublicProfile({ displayName: displayName.trim(), avatar: avatar || null });
      await refreshUser();
      toast.success("Community profile updated");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update community profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const initials = (user.displayName ?? user.name ?? "?").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.displayName ?? "Community profile"} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.displayName ?? "Student"}</p>
            <p className="text-muted-foreground text-xs">Shown to other students in Community and Chat</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit community profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <AvatarUploadField value={avatar} onChange={setAvatar} fallback={initials} />
            <div className="flex w-full flex-col gap-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you'd like to appear"
                maxLength={40}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
