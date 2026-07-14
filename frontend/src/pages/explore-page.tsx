import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api";
import { PlacesView } from "@/features/places/places-view";
import { toTravelProfileDTO, type TravelProfileRaw } from "@/features/discovery/discovery-dto";

export default function ExplorePage() {
  const [defaultCity, setDefaultCity] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>("/api/discovery/profile")
      .then(({ profile }) => setDefaultCity(toTravelProfileDTO(profile).destinationCity))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <PageHeader title="Explore" description="Places to explore in your destination city" />
      <PlacesView defaultCity={defaultCity} />
    </div>
  );
}
