import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { DiscoveryCard } from "@/features/discovery/discovery-card";
import { DiscoveryFilters, EMPTY_FILTERS, buildDiscoveryQuery, type DiscoveryFilterState } from "@/features/discovery/discovery-filters";
import type { DiscoveryCardDTO } from "@/features/discovery/discovery-dto";

export function CoPackerView({ hasProfile }: { hasProfile: boolean }) {
  const [filters, setFilters] = useState<DiscoveryFilterState>(EMPTY_FILTERS);
  const [results, setResults] = useState<DiscoveryCardDTO[] | null>(null);

  useEffect(() => {
    if (!hasProfile) {
      setResults([]);
      return;
    }
    api
      .get<{ results: DiscoveryCardDTO[] }>(`/api/discovery/co-packers?${buildDiscoveryQuery(filters)}`)
      .then(({ results }) => setResults(results))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load co-packers"));
  }, [filters, hasProfile]);

  if (!hasProfile) {
    return (
      <EmptyState
        icon={Users}
        title="Save your travel profile first"
        description="Fill in your current city, destination, and travel month above to find co-packers."
      />
    );
  }

  return (
    <div>
      <DiscoveryFilters value={filters} onChange={setFilters} />
      {results === null ? null : results.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No co-packers found yet"
          description="No one else is travelling your exact route this month — check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((card) => (
            <DiscoveryCard key={card.userId} card={card} context="co_packer" />
          ))}
        </div>
      )}
    </div>
  );
}
