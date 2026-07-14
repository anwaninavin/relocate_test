import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { PageHeader } from "@/components/shared/page-header";
import { BookingsView } from "@/features/bookings/bookings-view";
import { RemindersBanner } from "@/features/bookings/reminders-banner";
import { TravelBookingFormDialog } from "@/features/bookings/travel-booking-form-dialog";
import { StayBookingFormDialog } from "@/features/bookings/stay-booking-form-dialog";
import { toBookingDTO, type BookingDTO, type BookingRaw } from "@/features/bookings/booking-dto";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);

  async function fetchData() {
    try {
      const { bookings: raw } = await api.get<{ bookings: BookingRaw[] }>("/api/bookings");
      setBookings(raw.map(toBookingDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load bookings");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Travel and stay bookings, with reminders before they're due"
        action={
          <div className="flex gap-2">
            <TravelBookingFormDialog />
            <StayBookingFormDialog />
          </div>
        }
      />
      <RemindersBanner />
      <BookingsView bookings={bookings} onChanged={fetchData} />
    </div>
  );
}
