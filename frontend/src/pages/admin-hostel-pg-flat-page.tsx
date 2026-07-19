import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { ListingsAdminView } from "@/features/admin/listings-admin-view";
import { toAdminListingDTO, type AdminListingDTO, type AdminListingRaw } from "@/features/admin/listing-dto";

export default function AdminHostelPgFlatPage() {
  const [listings, setListings] = useState<AdminListingDTO[]>([]);

  async function fetchData() {
    try {
      const { listings: raw } = await api.get<{ listings: AdminListingRaw[] }>("/api/admin/listings");
      setListings(raw.map(toAdminListingDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load listings");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <ListingsAdminView listings={listings} />
    </div>
  );
}
