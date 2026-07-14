import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { CitiesView } from "@/features/admin/cities-view";
import { toAdminCityDTO, type AdminCityDTO, type AdminCityRaw } from "@/features/admin/city-dto";

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<AdminCityDTO[]>([]);

  async function fetchData() {
    try {
      const { cities: raw } = await api.get<{ cities: AdminCityRaw[] }>("/api/admin/cities");
      setCities(raw.map(toAdminCityDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load cities");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <CitiesView cities={cities} />
    </div>
  );
}
