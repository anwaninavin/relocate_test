import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, MoreVertical, UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminAddCommunityMember,
  adminBulkAddCommunityMembers,
  adminListCommunityMembers,
} from "@/features/community/community-api";
import { api, ApiError } from "@/lib/api";
import type { CommunityDTO, CommunityRole, PublicUserDTO } from "@/types";

interface MemberRow {
  userId: PublicUserDTO;
  role: CommunityRole;
  muted: boolean;
  banned: boolean;
}

const ASSIGNABLE_ROLES: CommunityRole[] = ["admin", "moderator", "verified", "member"];

export function CommunityMembersDialog({ community, trigger }: { community: CommunityDTO; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState("");
  const [addingByMobile, setAddingByMobile] = useState(false);

  const [city, setCity] = useState("");
  const [college, setCollege] = useState("");
  const [campus, setCampus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [addAll, setAddAll] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { members } = await adminListCommunityMembers(community._id);
      setMembers(members as MemberRow[]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleAddByMobile() {
    if (!mobile.trim()) return;
    setAddingByMobile(true);
    try {
      await adminAddCommunityMember(community._id, mobile.trim());
      toast.success("Member added");
      setMobile("");
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add member");
    } finally {
      setAddingByMobile(false);
    }
  }

  async function handleBulkAdd() {
    if (!addAll && !city.trim() && !college.trim() && !campus.trim() && !courseId.trim()) {
      toast.error("Pick a filter, or check \"Everyone in the system\"");
      return;
    }
    setBulkAdding(true);
    try {
      const result = await adminBulkAddCommunityMembers(community._id, {
        all: addAll || undefined,
        city: !addAll && city.trim() ? city.trim() : undefined,
        college: !addAll && college.trim() ? college.trim() : undefined,
        campus: !addAll && campus.trim() ? campus.trim() : undefined,
        courseId: !addAll && courseId.trim() ? courseId.trim() : undefined,
      });
      toast.success(`Added ${result.added} of ${result.matched} matching users`);
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bulk add failed");
    } finally {
      setBulkAdding(false);
    }
  }

  async function handleRoleChange(userId: string, role: CommunityRole) {
    try {
      await api.patch(`/api/admin/communities/${community._id}/members/${userId}/role`, { role });
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update role");
    }
  }

  async function handleRemove(userId: string) {
    try {
      await api.delete(`/api/admin/communities/${community._id}/members/${userId}`);
      toast.success("Member removed");
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to remove member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Members — {community.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-3">
          <p className="text-sm font-medium">Add a specific user</p>
          <div className="flex gap-2">
            <Input placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            <Button size="sm" onClick={handleAddByMobile} disabled={addingByMobile}>
              {addingByMobile && <Loader2 className="size-4 animate-spin" />}
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-3">
          <p className="text-sm font-medium">Add everyone from a city, college, campus, or course</p>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={addAll} />
            <Input placeholder="College" value={college} onChange={(e) => setCollege(e.target.value)} disabled={addAll} />
            <Input placeholder="Campus" value={campus} onChange={(e) => setCampus(e.target.value)} disabled={addAll} />
            <Input placeholder="Course ID" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={addAll} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={addAll} onCheckedChange={(v) => setAddAll(Boolean(v))} />
            Everyone in the system
          </label>
          <Button size="sm" variant="outline" onClick={handleBulkAdd} disabled={bulkAdding}>
            {bulkAdding && <Loader2 className="size-4 animate-spin" />}
            Add matching users
          </Button>
        </div>

        <Separator />

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <UsersRound className="size-4" /> No members yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((m) => (
              <div key={m.userId.id} className="flex items-center gap-2.5 rounded-xl p-2">
                <Avatar className="size-8">
                  <AvatarImage src={m.userId.avatar ?? undefined} />
                  <AvatarFallback>{m.userId.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.userId.displayName}</p>
                  <p className="text-muted-foreground truncate text-xs">@{m.userId.username}</p>
                </div>
                <Badge variant={m.role === "owner" ? "accent" : "outline"} className="capitalize">
                  {m.role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Member actions">
                      <MoreVertical className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <DropdownMenuItem key={role} onClick={() => handleRoleChange(m.userId.id, role)}>
                        Make {role}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem variant="destructive" onClick={() => handleRemove(m.userId.id)}>
                      Remove from community
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
