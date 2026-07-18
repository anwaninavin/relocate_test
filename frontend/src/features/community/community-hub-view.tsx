import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Search, ShieldCheck, Users2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityCard } from "@/features/community/community-card";
import { CreateCommunityDialog } from "@/features/community/create-community-dialog";
import { CommunityProfileSetupDialog } from "@/features/community/community-profile-setup-dialog";
import { discoverCommunities, joinCommunity, listMyCommunities } from "@/features/community/community-api";
import { readPersistedMyCommunities, writePersistedMyCommunities } from "@/features/community/community-cache";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import type { CommunityDTO } from "@/types";

type TabValue = "mine" | "discover";

export function CommunityHubView() {
  const { user } = useAuth();
  const cachedMine = readPersistedMyCommunities(user?.id);
  const [mine, setMine] = useState<CommunityDTO[]>(cachedMine ?? []);
  const [discover, setDiscover] = useState<CommunityDTO[]>([]);
  // Seeded true from cache: the page then paints real cards on first render instead of a
  // skeleton, and revalidates in the background — same contract as auth-context's persisted
  // user. Discover has no such cache (see the tab-activation effect below for why it doesn't
  // need one): it only ever starts loading once the user actually opens that tab.
  const [loadingMine, setLoadingMine] = useState(cachedMine === null);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [query, setQuery] = useState("");
  // "mine" is the tab shown on landing, so it's the only one worth fetching eagerly.
  // Discover's fetch is deferred to first activation (below) rather than firing in parallel on
  // mount: this backend is a single small instance, and two authenticated GETs racing at page
  // load meant the tab the user actually lands on waited behind a request for a tab they may
  // never open.
  const [activeTab, setActiveTab] = useState<TabValue>("mine");

  async function fetchMine() {
    setLoadingMine(true);
    try {
      const { communities } = await listMyCommunities();
      setMine(communities);
      writePersistedMyCommunities(user?.id, communities);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load your communities");
    } finally {
      setLoadingMine(false);
    }
  }

  async function fetchDiscover(q?: string) {
    setLoadingDiscover(true);
    try {
      const { communities } = await discoverCommunities({ q });
      setDiscover(communities);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load communities");
    } finally {
      setLoadingDiscover(false);
    }
  }

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== "discover") return;
    // No delay on the tab's first activation (query is still "") — the debounce only exists
    // to avoid a request per keystroke once the user is actually typing in a visible box.
    const handle = setTimeout(() => fetchDiscover(query || undefined), query ? 300 : 0);
    return () => clearTimeout(handle);
  }, [activeTab, query]);

  async function handleJoin(community: CommunityDTO) {
    setDiscover((list) => list.map((c) => (c._id === community._id ? { ...c, joined: true, memberCount: c.memberCount + 1 } : c)));
    try {
      await joinCommunity(community._id);
      fetchMine();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to join community");
      fetchDiscover(query || undefined);
    }
  }

  const discoverable = discover.filter((c) => !c.joined);

  return (
    <div>
      <PageHeader
        title="Community"
        action={
          user?.role === "admin" ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/communities">
                <ShieldCheck className="size-4" /> Manage all
              </Link>
            </Button>
          ) : undefined
        }
      />

      <CommunityProfileSetupDialog />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="mine">My Communities</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          {loadingMine ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <EmptyState icon={Users2} title="No communities yet" description="Complete your profile to auto-join your college and city communities." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((c) => (
                <CommunityCard key={c._id} community={{ ...c, joined: true }} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-4">
          <div className="relative mb-4">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input placeholder="Search communities..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {loadingDiscover ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : discoverable.length === 0 ? (
            <EmptyState icon={Search} title="No communities found" description="Try a different search, or create your own." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {discoverable.map((c) => (
                <CommunityCard key={c._id} community={c} onJoinToggle={handleJoin} />
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <CreateCommunityDialog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
