import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, UserX, ShieldOff, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { startDirectConversation } from "@/features/community/community-api";
import {
  toIncomingRequestDTO,
  toOutgoingRequestDTO,
  toAcceptedConnectionDTO,
  type ConnectionContext,
  type ConnectionRequestDTO,
  type ConnectionRequestRaw,
} from "@/features/discovery/discovery-dto";

function RequestRow({ request, children }: { request: ConnectionRequestDTO; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-row items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={request.otherUser.avatar ?? undefined} />
          <AvatarFallback>{(request.otherUser.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{request.otherUser.name ?? "Student"}</p>
          <p className="text-muted-foreground text-xs">
            {request.context === "co_packer" ? "Co-Packer" : "Roommate"} · {request.otherUser.college ?? "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </Card>
  );
}

/** Opens (or reuses) the DM with a connection and jumps into it — the bridge from a match to
 * an actual conversation. The endpoint is idempotent per pair, so tapping this repeatedly
 * lands in the same thread rather than spawning duplicates. */
function MessageButton({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  async function handleMessage() {
    setStarting(true);
    try {
      const { conversation } = await startDirectConversation(userId);
      navigate(`/chat/${conversation._id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to start conversation");
      setStarting(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleMessage} disabled={starting}>
      <MessageSquare className="size-4" /> Message
    </Button>
  );
}

/** @param context - Scopes every request list to one matcher. Co-packers and roommates now
 * live on separate pages, so each shows only its own requests; omit to show both. */
export function ConnectionsView({ context }: { context?: ConnectionContext }) {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ConnectionRequestDTO[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequestDTO[]>([]);
  const [accepted, setAccepted] = useState<ConnectionRequestDTO[]>([]);
  const [blocked, setBlocked] = useState<{ _id: string; name: string | null; mobile: string }[]>([]);

  async function refresh() {
    const inContext = (r: ConnectionRequestDTO) => !context || r.context === context;
    try {
      const [inc, out, acc, blk] = await Promise.all([
        api.get<{ requests: ConnectionRequestRaw[] }>("/api/discovery/connections/incoming"),
        api.get<{ requests: ConnectionRequestRaw[] }>("/api/discovery/connections/outgoing"),
        api.get<{ connections: ConnectionRequestRaw[] }>("/api/discovery/connections/accepted"),
        api.get<{ blocked: { _id: string; name: string | null; mobile: string }[] }>("/api/discovery/blocked"),
      ]);
      setIncoming(inc.requests.map(toIncomingRequestDTO).filter(inContext));
      setOutgoing(out.requests.map(toOutgoingRequestDTO).filter(inContext));
      if (user) setAccepted(acc.connections.map((c) => toAcceptedConnectionDTO(c, user.id)).filter(inContext));
      setBlocked(blk.blocked);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load connections");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, context]);

  async function respond(id: string, status: "accepted" | "declined") {
    try {
      await api.patch(`/api/discovery/connections/${id}`, { status });
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update request");
    }
  }

  async function unblock(userId: string) {
    try {
      await api.delete(`/api/discovery/block/${userId}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to unblock user");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Incoming requests</h3>
        {incoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending requests.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {incoming.map((r) => (
              <RequestRow key={r.id} request={r}>
                <Button size="sm" onClick={() => respond(r.id, "accepted")}>
                  <Check className="size-4" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => respond(r.id, "declined")}>
                  <X className="size-4" /> Decline
                </Button>
              </RequestRow>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Sent requests</h3>
        {outgoing.length === 0 ? (
          <p className="text-muted-foreground text-sm">You haven't sent any requests yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {outgoing.map((r) => (
              <RequestRow key={r.id} request={r}>
                <Badge variant={r.status === "accepted" ? "success" : r.status === "declined" ? "destructive" : "outline"}>
                  {r.status}
                </Badge>
              </RequestRow>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Connections</h3>
        {accepted.length === 0 ? (
          <EmptyState icon={UserX} title="No connections yet" description="Accepted requests will show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map((r) => (
              <RequestRow key={r.id} request={r}>
                <MessageButton userId={r.otherUser._id} />
                {/* Accepting a match isn't final — either side can back out afterwards. */}
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline">
                      <X className="size-4" /> Reject
                    </Button>
                  }
                  title={`Reject ${r.otherUser.name ?? "this student"}?`}
                  description="You'll both drop out of each other's connections. They can send you a new request later, and so can you."
                  confirmLabel="Reject"
                  onConfirm={() => respond(r.id, "declined")}
                />
              </RequestRow>
            ))}
          </div>
        )}
      </div>

      {blocked.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Blocked users</h3>
          <div className="flex flex-col gap-2">
            {blocked.map((b) => (
              <Card key={b._id} className="flex flex-row items-center justify-between gap-3 p-3">
                <span>{b.name ?? b.mobile}</span>
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline">
                      <ShieldOff className="size-4" /> Unblock
                    </Button>
                  }
                  title="Unblock this user?"
                  description="They'll be able to see your profile and send requests again."
                  destructive={false}
                  onConfirm={() => unblock(b._id)}
                />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
