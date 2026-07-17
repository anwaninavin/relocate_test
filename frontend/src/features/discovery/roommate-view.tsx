import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { DiscoveryCard } from "@/features/discovery/discovery-card";
import { DiscoveryFilters, EMPTY_FILTERS, buildDiscoveryQuery, type DiscoveryFilterState } from "@/features/discovery/discovery-filters";
import type { DiscoveryCardDTO } from "@/features/discovery/discovery-dto";

/** @param onEditProfile - Sends the student to the travel-profile form when they have no
 * profile yet. Matching is impossible without one, so this is the only way out of the empty
 * state — the form lives in a sibling tab, not on screen. */
export function RoommateView({ hasProfile, onEditProfile }: { hasProfile: boolean; onEditProfile?: () => void }) {
  const [filters, setFilters] = useState<DiscoveryFilterState>(EMPTY_FILTERS);
  const [results, setResults] = useState<DiscoveryCardDTO[] | null>(null);

  useEffect(() => {
    if (!hasProfile) {
      setResults([]);
      return;
    }
    api
      .get<{ results: DiscoveryCardDTO[] }>(`/api/discovery/roommates?${buildDiscoveryQuery(filters)}`)
      .then(({ results }) => setResults(results))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load roommates"));
  }, [filters, hasProfile]);

  if (!hasProfile) {
    return (
      <EmptyState
        icon={Home}
        title="Save your travel profile first"
        description="Tell us where you're headed and roughly when, and we'll match you with roomies arriving around the same time."
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

  return (
    <div>
      <DiscoveryFilters value={filters} onChange={setFilters} showRoommateFilters />
      {results === null ? null : results.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No roommates found yet"
          description="No one else is arriving in your destination city yet — check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((card) => (
            <DiscoveryCard key={card.userId} card={card} context="roommate" />
          ))}
        </div>
      )}
    </div>
  );
}
