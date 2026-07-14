import type { AccommodationType, BookingStatus, TravelType } from "@/types";

export interface BookingReminderDTO {
  key: string;
  offsetHours: number;
  dismissed: boolean;
}

export interface BookingDTO {
  id: string;
  category: "travel" | "stay";
  title: string;
  status: BookingStatus;
  eventTime: string;
  travelType: TravelType | null;
  pnr: string | null;
  flightNumber: string | null;
  busOperator: string | null;
  seatNumber: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  accommodationType: AccommodationType | null;
  propertyName: string | null;
  address: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  rent: number | null;
  deposit: number | null;
  roomSharing: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  mapLink: string | null;
  paymentPending: boolean;
  documentsReady: boolean;
  reminders: BookingReminderDTO[];
}

export interface BookingRaw extends Omit<BookingDTO, "id"> {
  _id: string;
}

export function toBookingDTO(raw: BookingRaw): BookingDTO {
  const { _id, ...rest } = raw;
  return { id: _id, ...rest };
}

export interface DueReminderDTO {
  bookingId: string;
  title: string;
  category: "travel" | "stay";
  key: string;
  eventTime: string;
  hoursRemaining: number;
}

export interface MissedBookingDTO {
  bookingId: string;
  title: string;
  category: "travel" | "stay";
  eventTime: string;
}

export const REMINDER_LABELS: Record<string, string> = {
  "24h": "24 hours before",
  "12h": "12 hours before",
  "6h": "6 hours before",
  "1h": "1 hour before",
  packing: "Pack your bags",
  documents: "Check your documents",
  payment: "Payment due",
  check_in: "Check-in reminder",
};
