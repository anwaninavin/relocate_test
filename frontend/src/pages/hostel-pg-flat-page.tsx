import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { api, peekCache } from "@/lib/api";
import { ListingsView } from "@/features/listings/listings-view";
import { toTravelProfileDTO, type TravelProfileRaw } from "@/features/discovery/discovery-dto";

const DISCOVERY_PROFILE_PATH = "/api/discovery/profile";

export default function HostelPgFlatPage() {
  const cachedProfile = peekCache<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH);
  const [defaultCity, setDefaultCity] = useState(() => toTravelProfileDTO(cachedProfile?.profile ?? null).destinationCity);
  const [loaded, setLoaded] = useState(() => cachedProfile !== undefined);

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH)
      .then(({ profile }) => setDefaultCity(toTravelProfileDTO(profile).destinationCity))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <PageHeader title="Hostel, PG, Flat" description="Browse available hostels, PGs, and flats to rent" />
      <ListingsView defaultCity={defaultCity} />
    </div>
  );
}
