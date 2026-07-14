import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import type { SuggestedItemDTO, SuggestedItemUserDTO } from "@/features/admin/suggested-item-dto";

export function ViewSuggestedItemUsersDialog({ suggestion }: { suggestion: SuggestedItemDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SuggestedItemUserDTO[] | null>(null);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && users === null) {
      setLoading(true);
      try {
        const { users: raw } = await api.get<{ users: SuggestedItemUserDTO[] }>(
          `/api/admin/suggested-items/${encodeURIComponent(suggestion.key)}/users`,
        );
        setUsers(raw);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load students");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          {suggestion.usersUsing} {suggestion.usersUsing === 1 ? "student" : "students"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Students who added "{suggestion.name}"</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>College category</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.userId}>
                  <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                  <TableCell>{u.mobile}</TableCell>
                  <TableCell>{u.collegeCategory ?? "—"}</TableCell>
                  <TableCell>{u.course ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.checked ? "default" : "outline"}>{u.checked ? "Packed" : "Pending"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
