import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { DiscoveryCard } from "@/features/discovery/discovery-card";
import { DiscoveryFilters, EMPTY_FILTERS, buildDiscoveryQuery, type DiscoveryFilterState } from "@/features/discovery/discovery-filters";
import type { DiscoveryCardDTO } from "@/features/discovery/discovery-dto";

export function RoommateView({ hasProfile }: { hasProfile: boolean }) {
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
        description="Fill in your destination city above to find roommates arriving around the same time."
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
