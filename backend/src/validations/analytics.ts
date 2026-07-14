import { z } from "zod";

import { CLIENT_EVENT_NAMES } from "@/models/AnalyticsEvent";

const utmSchema = z
  .object({
    source: z.string().trim().max(120).nullish(),
    medium: z.string().trim().max(120).nullish(),
    campaign: z.string().trim().max(120).nullish(),
    term: z.string().trim().max(120).nullish(),
    content: z.string().trim().max(120).nullish(),
  })
  .partial()
  .optional();

const deviceSchema = z
  .object({
    type: z.enum(["mobile", "desktop", "tablet"]).optional(),
    screenWidth: z.number().int().positive().max(20000).nullish(),
    screenHeight: z.number().int().positive().max(20000).nullish(),
  })
  .optional();

/** One event as sent by the browser's batched collector. `userId` is deliberately not
 * accepted here — it's always derived server-side from the bearer token, never trusted
 * from the client, so a visitor can't attribute events to another account. */
export const clientEventSchema = z.object({
  eventName: z.enum(CLIENT_EVENT_NAMES),
  visitorId: z.string().trim().min(1).max(80),
  sessionId: z.string().trim().min(1).max(80),
  page: z.string().trim().max(500).nullish(),
  referrer: z.string().trim().max(1000).nullish(),
  utm: utmSchema,
  device: deviceSchema,
  language: z.string().trim().max(40).nullish(),
  timezone: z.string().trim().max(80).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  timestamp: z.number().int().positive().optional(),
});

export const collectEventsSchema = z.object({
  events: z.array(clientEventSchema).min(1).max(50),
});

export type ClientEventInput = z.infer<typeof clientEventSchema>;

export const dateRangeQuerySchema = z.object({
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
