import { connectDB } from "@/db";
import { Booking, type BookingDocument } from "@/models/Booking";
import type { CreateBookingInput, UpdateBookingInput } from "@/validations/bookings";

interface ReminderSeed {
  key: string;
  offsetHours: number;
}

const TRAVEL_REMINDERS: ReminderSeed[] = [
  { key: "24h", offsetHours: 24 },
  { key: "12h", offsetHours: 12 },
  { key: "6h", offsetHours: 6 },
  { key: "1h", offsetHours: 1 },
  { key: "packing", offsetHours: 24 },
  { key: "documents", offsetHours: 48 },
  { key: "payment", offsetHours: 72 },
];

const STAY_REMINDERS: ReminderSeed[] = [{ key: "check_in", offsetHours: 24 }];

export async function listBookings(userId: string, category?: "travel" | "stay") {
  await connectDB();
  const filter: Record<string, unknown> = { userId };
  if (category) filter.category = category;
  return Booking.find(filter).sort({ eventTime: 1 }).lean();
}

export async function getBooking(userId: string, id: string) {
  await connectDB();
  return Booking.findOne({ _id: id, userId }).lean();
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  await connectDB();

  const eventTime = input.category === "travel" ? input.departureTime : input.checkInDate;
  const reminders = input.category === "travel" ? TRAVEL_REMINDERS : STAY_REMINDERS;

  return Booking.create({
    userId,
    ...input,
    eventTime,
    reminders: reminders.map((r) => ({ ...r, dismissed: false })),
  });
}

export async function updateBooking(userId: string, id: string, input: UpdateBookingInput) {
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  if (input.departureTime) update.eventTime = input.departureTime;
  if (input.checkInDate) update.eventTime = input.checkInDate;

  return Booking.findOneAndUpdate({ _id: id, userId }, update, { returnDocument: "after" }).lean();
}

export async function deleteBooking(userId: string, id: string) {
  await connectDB();
  return Booking.deleteOne({ _id: id, userId });
}

export async function dismissReminder(userId: string, id: string, key: string) {
  await connectDB();
  return Booking.findOneAndUpdate(
    { _id: id, userId, "reminders.key": key },
    { $set: { "reminders.$.dismissed": true } },
    { returnDocument: "after" },
  ).lean();
}

export interface DueReminder {
  bookingId: string;
  title: string;
  category: "travel" | "stay";
  key: string;
  eventTime: Date;
  hoursRemaining: number;
}

/** A reminder is "due" once we're within its offset window of the event and it hasn't fired
 * yet — computed live from the booking's own timestamps rather than stored/queued anywhere.
 * Payment/documents reminders only surface while that condition is still actually true. */
export function computeDueReminders(bookings: BookingDocument[]): DueReminder[] {
  const now = Date.now();
  const due: DueReminder[] = [];

  for (const booking of bookings) {
    if (booking.status !== "upcoming") continue;
    const eventTime = new Date(booking.eventTime).getTime();
    if (eventTime < now) continue;

    for (const reminder of booking.reminders) {
      if (reminder.dismissed) continue;
      if (reminder.key === "payment" && !booking.paymentPending) continue;
      if (reminder.key === "documents" && booking.documentsReady) continue;

      const fireAt = eventTime - reminder.offsetHours * 60 * 60 * 1000;
      if (fireAt <= now) {
        due.push({
          bookingId: (booking as unknown as { _id: { toString(): string } })._id.toString(),
          title: booking.title,
          category: booking.category as "travel" | "stay",
          key: reminder.key,
          eventTime: booking.eventTime,
          hoursRemaining: Math.round(((eventTime - now) / (60 * 60 * 1000)) * 10) / 10,
        });
      }
    }
  }

  return due.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
}

export interface MissedBooking {
  bookingId: string;
  title: string;
  category: "travel" | "stay";
  eventTime: Date;
}

/** Bookings whose event time has passed while still marked "upcoming" — surfaced as a
 * "missed booking" alert rather than silently disappearing. Also lazily flips their status
 * to "missed" so they drop out of future due-reminder checks. */
export async function getMissedBookings(userId: string): Promise<MissedBooking[]> {
  await connectDB();
  const now = new Date();
  const overdue = await Booking.find({ userId, status: "upcoming", eventTime: { $lt: now } }).lean();
  if (overdue.length === 0) return [];

  await Booking.updateMany({ _id: { $in: overdue.map((b) => b._id) } }, { status: "missed" });

  return overdue.map((b) => ({
    bookingId: b._id.toString(),
    title: b.title,
    category: b.category as "travel" | "stay",
    eventTime: b.eventTime,
  }));
}

export async function getDueRemindersForUser(userId: string) {
  await connectDB();
  const bookings = await Booking.find({ userId, status: "upcoming" }).lean();
  return computeDueReminders(bookings as unknown as BookingDocument[]);
}
