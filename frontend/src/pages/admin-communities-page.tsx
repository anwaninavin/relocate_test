import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { CommunitiesView } from "@/features/admin/communities-view";
import { adminListCommunities } from "@/features/community/community-api";
import type { CommunityDTO, CommunityStatus } from "@/types";

export default function AdminCommunitiesPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") as CommunityStatus | null;
  const [communities, setCommunities] = useState<CommunityDTO[]>([]);
  const [total, setTotal] = useState(0);

  async function fetchData() {
    try {
      const result = await adminListCommunities({ status: status ?? undefined });
      setCommunities(result.communities);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load communities");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <AdminTabs />
      <CommunitiesView communities={communities} total={total} />
    </div>
  );
}
