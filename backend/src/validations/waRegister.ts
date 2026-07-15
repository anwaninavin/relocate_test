import { z } from "zod";

import { mobileSchema } from "@/validations/auth";

export const waRegisterStartSchema = z.object({
  mobile: mobileSchema,
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export const waRegisterStatusSchema = z.object({
  // A crypto.randomBytes(32) hex token, not a Mongo ObjectId — see WaPendingRegistration's
  // pollToken field for why the raw document id must never be used here.
  pendingId: z.string().trim().regex(/^[a-f0-9]{64}$/i, "Invalid pendingId"),
});

export type WaRegisterStartInput = z.infer<typeof waRegisterStartSchema>;
export type WaRegisterStatusInput = z.infer<typeof waRegisterStatusSchema>;
