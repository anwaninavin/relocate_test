import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { ACCOMMODATION_TYPES, BOOKING_CATEGORIES, BOOKING_STATUSES, TRAVEL_TYPES } from "@/types";

/** Travel Booking and Stay Booking share one collection (`category` discriminator) — both
 * are "a thing I booked, at an address/time, that I want reminders about" with mostly
 * type-specific fields. Reminder *state* lives embedded on the document (`reminders[]`)
 * instead of a separate Notification collection: due reminders are computed on read by
 * comparing `eventTime - offsetHours` to now, and dismissal is just a flag on this array —
 * so no reminder is ever separately persisted/queued. */
const BookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: BOOKING_CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: BOOKING_STATUSES, default: "upcoming", index: true },

    // The single anchor timestamp reminders are computed relative to — departureTime for
    // travel, checkInDate for stay. Always set, regardless of category.
    eventTime: { type: Date, required: true, index: true },

    // --- Travel-specific ---
    travelType: { type: String, enum: TRAVEL_TYPES, default: null },
    pnr: { type: String, default: null, trim: true, maxlength: 40 },
    flightNumber: { type: String, default: null, trim: true, maxlength: 20 },
    busOperator: { type: String, default: null, trim: true, maxlength: 80 },
    seatNumber: { type: String, default: null, trim: true, maxlength: 20 },
    departureTime: { type: Date, default: null },
    arrivalTime: { type: Date, default: null },

    // --- Stay-specific ---
    accommodationType: { type: String, enum: ACCOMMODATION_TYPES, default: null },
    propertyName: { type: String, default: null, trim: true, maxlength: 120 },
    address: { type: String, default: null, trim: true, maxlength: 300 },
    ownerName: { type: String, default: null, trim: true, maxlength: 80 },
    ownerPhone: { type: String, default: null, trim: true, maxlength: 20 },
    rent: { type: Number, default: null, min: 0 },
    deposit: { type: Number, default: null, min: 0 },
    roomSharing: { type: String, default: null, trim: true, maxlength: 40 },
    checkInDate: { type: Date, default: null },
    checkOutDate: { type: Date, default: null },
    mapLink: { type: String, default: null, trim: true, maxlength: 500 },

    paymentPending: { type: Boolean, default: false },
    documentsReady: { type: Boolean, default: false },

    reminders: {
      type: [
        {
          key: { type: String, required: true }, // "24h" | "12h" | "6h" | "1h" | "packing" | "documents" | "payment" | "check_in"
          offsetHours: { type: Number, required: true },
          dismissed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

BookingSchema.index({ userId: 1, eventTime: 1 });

export type BookingDocument = InferSchemaType<typeof BookingSchema>;

export const Booking: Model<BookingDocument> = models.Booking || model<BookingDocument>("Booking", BookingSchema);
