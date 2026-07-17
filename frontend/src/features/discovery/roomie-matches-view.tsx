import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Home, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { startDirectConversation } from "@/features/community/community-api";
import { DiscoveryCard } from "@/features/discovery/discovery-card";
import {
  toIncomingRequestDTO,
  toAcceptedConnectionDTO,
  type ConnectionRequestDTO,
  type ConnectionRequestRaw,
  type DiscoveryCardDTO,
} from "@/features/discovery/discovery-dto";

/** Opens (or reuses) the DM with a connection and jumps into it. */
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
          <p className="text-muted-foreground text-xs">{request.otherUser.college ?? "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </Card>
  );
}

/** Find a Roomie's single Matches page: connections, received requests and the candidate deck
 * stacked together, replacing the old Matches/Requests tab split. There's no separate "sent
 * requests" list — a candidate already requested shows a disabled "Request sent" state on
 * their own card instead (see findRoommates' `requestStatus` and DiscoveryCard).
 *
 * Scoped entirely to `context: "roommate"` via its own fetches, independent of
 * `ConnectionsView` — Discover/Co-Packer keeps its own Requests tab and Sent-requests list
 * untouched.
 *
 * @param profileComplete - Whether the profile carries what roommate matching requires (see
 * isRoommateProfileComplete). The server returns no candidates without it, so without this the
 * student would get a "no roomies" screen blaming the city for a gap in their own profile.
 * @param onEditProfile - Sends the student to the travel-profile form; the only way out of the
 * empty state, since the form lives in a sibling tab, not on screen. */
export function RoomieMatchesView({
  hasProfile,
  profileComplete,
  onEditProfile,
}: {
  hasProfile: boolean;
  profileComplete: boolean;
  onEditProfile?: () => void;
}) {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ConnectionRequestDTO[]>([]);
  const [accepted, setAccepted] = useState<ConnectionRequestDTO[]>([]);
  const [matches, setMatches] = useState<DiscoveryCardDTO[] | null>(null);

  async function refresh() {
    const isRoommate = (r: ConnectionRequestDTO) => r.context === "roommate";
    try {
      const [inc, acc] = await Promise.all([
        api.get<{ requests: ConnectionRequestRaw[] }>("/api/discovery/connections/incoming"),
        api.get<{ connections: ConnectionRequestRaw[] }>("/api/discovery/connections/accepted"),
      ]);
      setIncoming(inc.requests.map(toIncomingRequestDTO).filter(isRoommate));
      if (user) setAccepted(acc.connections.map((c) => toAcceptedConnectionDTO(c, user.id)).filter(isRoommate));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load connections");
    }

    if (!hasProfile || !profileComplete) {
      setMatches([]);
      return;
    }
    try {
      const { results } = await api.get<{ results: DiscoveryCardDTO[] }>("/api/discovery/roommates");
      setMatches(results);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load roommates");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasProfile, profileComplete]);

  async function respond(id: string, status: "accepted" | "declined") {
    try {
      await api.patch(`/api/discovery/connections/${id}`, { status });
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update request");
    }
  }

  if (!hasProfile) {
    return (
      <EmptyState
        icon={Home}
        title="Save your travel profile first"
        action={
          onEditProfile && (
            <Button size="sm" onClick={onEditProfile}>
              Set up my profile
            </Button>
          )
        }
      />
    );
  }

  if (!profileComplete) {
    return (
      <EmptyState
        icon={Home}
        title="Finish your profile to see roomies"
        description="Matching needs your budget and the kind of place you're after — we only suggest people who overlap with both, so add them and your roomies will show up here."
        action={
          onEditProfile && (
            <Button size="sm" onClick={onEditProfile}>
              Complete my profile
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Connections</h3>
        {accepted.length === 0 ? (
          <EmptyState icon={Users} title="No connections yet" description="Accepted requests will show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map((r) => (
              <RequestRow key={r.id} request={r}>
                <MessageButton userId={r.otherUser._id} />
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

      <div>
        <h3 className="mb-2 text-sm font-semibold">Received requests</h3>
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
        <h3 className="mb-2 text-sm font-semibold">Matches</h3>
        {matches === null ? null : matches.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No roommates found yet"
            description="No one in your destination city matches your budget, accommodation type and gender preference yet — widening your budget helps, or check back later."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((card) => (
              <DiscoveryCard key={card.userId} card={card} context="roommate" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
