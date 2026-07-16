import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Users2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { CommunityFormDialog } from "@/features/admin/community-form-dialog";
import { CommunityMembersDialog } from "@/features/admin/community-members-dialog";
import {
  adminApproveCommunity,
  adminDeleteCommunity,
  adminRestoreCommunity,
  adminSuspendCommunity,
} from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CommunityDTO, CommunityStatus } from "@/types";

const STATUS_TABS: Array<{ value: CommunityStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
];

function statusVariant(status?: CommunityStatus) {
  if (status === "pending") return "outline" as const;
  if (status === "suspended") return "destructive" as const;
  return "accent" as const;
}

export function CommunitiesView({ communities: initial, total }: { communities: CommunityDTO[]; total: number }) {
  const [communities, setCommunities] = useState(initial);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get("status") as CommunityStatus | null) ?? "all";

  function setStatus(value: CommunityStatus | "all") {
    setSearchParams(value === "all" ? {} : { status: value });
  }

  async function handleApprove(id: string) {
    try {
      await adminApproveCommunity(id);
      toast.success("Community approved — now visible to everyone");
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to approve");
    }
  }

  async function handleSuspend(id: string) {
    try {
      await adminSuspendCommunity(id);
      toast.success("Community suspended");
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to suspend");
    }
  }

  async function handleDelete(id: string) {
    setCommunities((prev) => prev.map((c) => (c._id === id ? { ...c, active: false } : c)));
    try {
      await adminDeleteCommunity(id);
      toast.success("Community deleted");
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete");
      emitRefresh();
    }
  }

  async function handleRestore(id: string) {
    try {
      await adminRestoreCommunity(id);
      toast.success("Community restored");
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to restore");
    }
  }

  return (
    <div>
      <PageHeader
        title="Communities"
        description={`Every community in the system, admin-created or student-created — ${total} total`}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {communities.length === 0 ? (
        <EmptyState icon={Users2} title="No communities" description="Nothing matches this filter yet." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {communities.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">
                    <Link to={`/community/${c.slug}`} className="hover:underline">
                      {c.name}
                    </Link>
                    {c.active === false && (
                      <Badge variant="destructive" className="ml-2">
                        Deleted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{c.type}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)} className="capitalize">
                      {c.status ?? "approved"}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.memberCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <CommunityMembersDialog
                        community={c}
                        trigger={
                          <Button variant="outline" size="sm">
                            Members
                          </Button>
                        }
                      />
                      <CommunityFormDialog community={c} />
                      {c.status !== "approved" && (
                        <Button variant="outline" size="sm" onClick={() => handleApprove(c._id)}>
                          Approve
                        </Button>
                      )}
                      {c.status !== "suspended" && (
                        <Button variant="outline" size="sm" onClick={() => handleSuspend(c._id)}>
                          Suspend
                        </Button>
                      )}
                      {c.active === false ? (
                        <Button variant="outline" size="sm" onClick={() => handleRestore(c._id)}>
                          Restore
                        </Button>
                      ) : (
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline" size="sm">
                              Delete
                            </Button>
                          }
                          title="Delete this community?"
                          description="It will be hidden everywhere, but can be restored later."
                          onConfirm={() => handleDelete(c._id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
