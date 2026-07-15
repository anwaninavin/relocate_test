import { useState } from "react";
import { UserRoundX } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { formatMobileForDisplay } from "@/lib/phone";
import type { TempUserDTO } from "@/features/admin/temp-user-dto";

export function TempUsersView({ tempUsers: initial }: { tempUsers: TempUserDTO[] }) {
  const [tempUsers, setTempUsers] = useState(initial);

  async function handleDelete(id: string) {
    setTempUsers((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/api/admin/temp-users/${id}`);
      toast.success("Removed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to remove");
    }
  }

  return (
    <div>
      <PageHeader
        title="Pending WA Signups"
        description="Mobile numbers that started /wa-login registration but never sent the WhatsApp confirmation message — worth a manual follow-up."
      />

      {tempUsers.length === 0 ? (
        <EmptyState icon={UserRoundX} title="Nothing pending" description="No incomplete registrations right now." />
      ) : (
        <div className="flex flex-col gap-2">
          {tempUsers.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{formatMobileForDisplay(t.mobile)}</p>
                  <p className="text-muted-foreground text-xs">
                    Started {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline">
                      Remove
                    </Button>
                  }
                  title="Remove this entry?"
                  description="It'll no longer show up as a pending follow-up."
                  onConfirm={() => handleDelete(t.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
