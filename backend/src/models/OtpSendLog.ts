import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Tracks how many OTPs have been sent to one mobile number (per purpose, per calendar day),
 * independent of OtpVerification — that collection's individual codes TTL-expire after just
 * 10 minutes, so it can't answer "how many were sent today" on its own. Backed by Mongo
 * (rather than an in-memory counter) so the daily cap survives process restarts, which this
 * app's free-tier Render deployment does frequently (sleep-after-inactivity). */
const OtpSendLogSchema = new Schema({
  mobile: { type: String, required: true },
  purpose: { type: String, enum: ["register", "reset"], required: true },
  /** Calendar day in the server's local date, e.g. "2026-07-15" — coarse by design, this is
   * an abuse guard, not a billing-accurate rate limiter. */
  date: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

OtpSendLogSchema.index({ mobile: 1, purpose: 1, date: 1 }, { unique: true });
// TTL index: MongoDB deletes the doc once its own expiresAt value is in the past.
OtpSendLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpSendLogDocument = InferSchemaType<typeof OtpSendLogSchema>;

export const OtpSendLog: Model<OtpSendLogDocument> =
  models.OtpSendLog || model<OtpSendLogDocument>("OtpSendLog", OtpSendLogSchema);
