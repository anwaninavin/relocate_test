import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import type { ReportedContactDTO } from "@/features/admin/contact-moderation-dto";

export function ContactModerationView({ contacts: initialContacts }: { contacts: ReportedContactDTO[] }) {
  const [contacts, setContacts] = useState(initialContacts);

  async function handleVerify(id: string, verified: boolean) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, verified } : c)));
    try {
      await api.post(`/api/admin/directory-contacts/${id}/verify`, { verified });
      toast.success(verified ? "Contact verified" : "Verification removed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update contact");
    }
  }

  async function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.delete(`/api/admin/directory-contacts/${id}`);
      toast.success("Contact removed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete contact");
    }
  }

  return (
    <div>
      <PageHeader title="Reported contacts" description="Directory contacts flagged by students for review" />

      {contacts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Nothing to review" description="No reported contacts right now." />
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {contact.name}
                  {contact.verified && <Badge variant="success">Verified</Badge>}
                </CardTitle>
                <span className="text-muted-foreground text-xs">
                  {contact.city} · {contact.category} · {contact.phone}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1 text-sm">
                  {contact.reports.map((report, i) => (
                    <li key={i} className="text-muted-foreground">
                      "{report.reason}" — {new Date(report.createdAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleVerify(contact.id, !contact.verified)}>
                    {contact.verified ? "Remove verification" : "Mark verified"}
                  </Button>
                  <ConfirmDialog
                    trigger={<Button size="sm" variant="destructive">Remove contact</Button>}
                    title="Remove this contact?"
                    description="It will be deleted from the directory."
                    onConfirm={() => handleDelete(contact.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
