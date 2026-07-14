import { useEffect, useState } from "react";
import { AlertTriangle, Bell, X } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { REMINDER_LABELS, type DueReminderDTO, type MissedBookingDTO } from "@/features/bookings/booking-dto";

export function RemindersBanner() {
  const [due, setDue] = useState<DueReminderDTO[]>([]);
  const [missed, setMissed] = useState<MissedBookingDTO[]>([]);

  async function fetchReminders() {
    try {
      const result = await api.get<{ due: DueReminderDTO[]; missed: MissedBookingDTO[] }>("/api/bookings/reminders/due");
      setDue(result.due);
      setMissed(result.missed);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load reminders");
    }
  }

  useEffect(() => {
    fetchReminders();
  }, []);

  async function dismiss(bookingId: string, key: string) {
    setDue((prev) => prev.filter((r) => !(r.bookingId === bookingId && r.key === key)));
    try {
      await api.post(`/api/bookings/${bookingId}/reminders/${key}/dismiss`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to dismiss reminder");
    }
  }

  if (due.length === 0 && missed.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-2">
      {missed.map((m) => (
        <Card key={m.bookingId} className="border-destructive/30 bg-destructive/5 flex items-center gap-3 p-3">
          <AlertTriangle className="text-destructive size-5 shrink-0" />
          <p className="text-sm">
            <span className="font-medium">Missed booking:</span> {m.title} was scheduled for{" "}
            {new Date(m.eventTime).toLocaleString()}.
          </p>
        </Card>
      ))}
      {due.map((r) => (
        <Card key={`${r.bookingId}-${r.key}`} className="border-warning/30 bg-warning/5 flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <Bell className="text-warning size-5 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">{REMINDER_LABELS[r.key] ?? r.key}:</span> {r.title} — {r.hoursRemaining}h remaining
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => dismiss(r.bookingId, r.key)}>
            <X className="size-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
