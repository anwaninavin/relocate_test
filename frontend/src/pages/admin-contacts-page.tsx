import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { ContactModerationView } from "@/features/admin/contact-moderation-view";
import { toReportedContactDTO, type ReportedContactDTO, type ReportedContactRaw } from "@/features/admin/contact-moderation-dto";

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ReportedContactDTO[]>([]);

  async function fetchData() {
    try {
      const { contacts: raw } = await api.get<{ contacts: ReportedContactRaw[] }>("/api/admin/directory-contacts/reported");
      setContacts(raw.map(toReportedContactDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load reported contacts");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <ContactModerationView contacts={contacts} />
    </div>
  );
}
