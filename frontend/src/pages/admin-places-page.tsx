import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { PlacesAdminView } from "@/features/admin/places-admin-view";
import { toAdminPlaceDTO, type AdminPlaceDTO, type AdminPlaceRaw } from "@/features/admin/place-dto";

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<AdminPlaceDTO[]>([]);

  async function fetchData() {
    try {
      const { places: raw } = await api.get<{ places: AdminPlaceRaw[] }>("/api/admin/places");
      setPlaces(raw.map(toAdminPlaceDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load places");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <PlacesAdminView places={places} />
    </div>
  );
}
