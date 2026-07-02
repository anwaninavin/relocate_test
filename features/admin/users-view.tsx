"use client";

import Link from "next/link";
import { format } from "date-fns";
import { KeyRound, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { UserFormDialog } from "@/features/admin/user-form-dialog";
import { formatMobileForDisplay } from "@/lib/phone";
import type { AdminUserDTO } from "@/features/admin/user-dto";

export function UsersView({
  users,
  page,
  totalPages,
}: {
  users: AdminUserDTO[];
  page: number;
  totalPages: number;
}) {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone with access to Pack with Me"
        action={<UserFormDialog />}
      />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Users appear here after their first login, or once you add one."
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Login code</TableHead>
                <TableHead>Hostel / Room</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell>{formatMobileForDisplay(user.mobile)}</TableCell>
                  <TableCell>
                    {user.hasPinSet ? (
                      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                        <KeyRound className="size-3.5" />
                        Set
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.hostel ?? "—"} {user.roomNumber ? `/ ${user.roomNumber}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "accent" : "outline"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "d MMM yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <UserFormDialog
                        user={user}
                        trigger={
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="border-border/60 flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page <= 1 ? (
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {page >= totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users?page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
