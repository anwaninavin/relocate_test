import { z } from "zod";

import { ACCOMMODATION_TYPES, TRAVEL_TYPES } from "@/types";

const travelFields = z.object({
  travelType: z.enum(TRAVEL_TYPES),
  pnr: z.string().trim().max(40).optional().or(z.literal("")),
  flightNumber: z.string().trim().max(20).optional().or(z.literal("")),
  busOperator: z.string().trim().max(80).optional().or(z.literal("")),
  seatNumber: z.string().trim().max(20).optional().or(z.literal("")),
  departureTime: z.coerce.date(),
  arrivalTime: z.coerce.date().optional().nullable(),
});

const stayFields = z.object({
  accommodationType: z.enum(ACCOMMODATION_TYPES),
  propertyName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  ownerName: z.string().trim().max(80).optional().or(z.literal("")),
  ownerPhone: z.string().trim().max(20).optional().or(z.literal("")),
  rent: z.coerce.number().min(0).optional().nullable(),
  deposit: z.coerce.number().min(0).optional().nullable(),
  roomSharing: z.string().trim().max(40).optional().or(z.literal("")),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date().optional().nullable(),
  mapLink: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createBookingSchema = z.discriminatedUnion("category", [
  z.object({ category: z.literal("travel"), title: z.string().trim().min(1).max(120) }).merge(travelFields),
  z.object({ category: z.literal("stay"), title: z.string().trim().min(1).max(120) }).merge(stayFields),
]);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["upcoming", "completed", "missed", "cancelled"]).optional(),
  paymentPending: z.boolean().optional(),
  documentsReady: z.boolean().optional(),
  departureTime: z.coerce.date().optional(),
  arrivalTime: z.coerce.date().optional().nullable(),
  checkInDate: z.coerce.date().optional(),
  checkOutDate: z.coerce.date().optional().nullable(),
  pnr: z.string().trim().max(40).optional(),
  flightNumber: z.string().trim().max(20).optional(),
  busOperator: z.string().trim().max(80).optional(),
  seatNumber: z.string().trim().max(20).optional(),
  propertyName: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  ownerName: z.string().trim().max(80).optional(),
  ownerPhone: z.string().trim().max(20).optional(),
  rent: z.coerce.number().min(0).optional().nullable(),
  deposit: z.coerce.number().min(0).optional().nullable(),
  roomSharing: z.string().trim().max(40).optional(),
  mapLink: z.string().trim().max(500).optional(),
});

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
