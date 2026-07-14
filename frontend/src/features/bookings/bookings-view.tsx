import { useState } from "react";
import { Ticket, MapPin, Train, Plane, Bus, Car, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, ApiError } from "@/lib/api";
import type { BookingDTO } from "@/features/bookings/booking-dto";

const TRAVEL_ICONS = { Train, Flight: Plane, Bus, Cab: Car } as const;

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  upcoming: "outline",
  completed: "success",
  missed: "destructive",
  cancelled: "warning",
};

function BookingCard({ booking, onChanged }: { booking: BookingDTO; onChanged: () => void }) {
  async function updateFlag(field: "paymentPending" | "documentsReady", value: boolean) {
    try {
      await api.patch(`/api/bookings/${booking.id}`, { [field]: value });
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update booking");
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/api/bookings/${booking.id}`);
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete booking");
    }
  }

  const TravelIcon = booking.travelType ? TRAVEL_ICONS[booking.travelType] : Ticket;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <TravelIcon className="text-primary size-5" />
          <div>
            <p className="font-medium">{booking.title}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(booking.eventTime).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant={STATUS_TONE[booking.status]}>{booking.status}</Badge>
      </div>

      {booking.category === "travel" ? (
        <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {booking.pnr && <span>PNR: {booking.pnr}</span>}
          {booking.flightNumber && <span>Flight: {booking.flightNumber}</span>}
          {booking.busOperator && <span>Operator: {booking.busOperator}</span>}
          {booking.seatNumber && <span>Seat: {booking.seatNumber}</span>}
        </div>
      ) : (
        <div className="text-muted-foreground flex flex-col gap-1 text-xs">
          {booking.propertyName && <span className="font-medium text-foreground">{booking.propertyName}</span>}
          {booking.address && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {booking.address}
            </span>
          )}
          {booking.rent != null && <span>Rent: ₹{booking.rent.toLocaleString("en-IN")}</span>}
          {booking.roomSharing && <span>Sharing: {booking.roomSharing}</span>}
          {booking.mapLink && (
            <a href={booking.mapLink} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
              View on map
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={booking.paymentPending} onCheckedChange={(v) => updateFlag("paymentPending", v)} />
          Payment pending
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={booking.documentsReady} onCheckedChange={(v) => updateFlag("documentsReady", v)} />
          Documents ready
        </label>
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="ghost" className="ml-auto">
              <Trash2 className="size-4" />
            </Button>
          }
          title="Delete this booking?"
          description="This can't be undone."
          onConfirm={handleDelete}
        />
      </div>
    </Card>
  );
}

export function BookingsView({ bookings, onChanged }: { bookings: BookingDTO[]; onChanged: () => void }) {
  const [category, setCategory] = useState<"travel" | "stay">("travel");
  const filtered = bookings.filter((b) => b.category === category);

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-full bg-muted p-1 w-fit">
        {(["travel", "stay"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              category === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Ticket} title={`No ${category} bookings yet`} description="Add one to get reminders before it's due." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
