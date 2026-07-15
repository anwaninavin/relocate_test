import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { TempUsersView } from "@/features/admin/temp-users-view";
import type { TempUserDTO } from "@/features/admin/temp-user-dto";

export default function AdminTempUsersPage() {
  const [tempUsers, setTempUsers] = useState<TempUserDTO[]>([]);

  async function fetchData() {
    try {
      const { tempUsers } = await api.get<{ tempUsers: TempUserDTO[] }>("/api/admin/temp-users");
      setTempUsers(tempUsers);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load pending signups");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <TempUsersView tempUsers={tempUsers} />
    </div>
  );
}
