import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Log of mobile+PIN login attempts, purely for rate-limiting (see lib/rate-limit.ts). */
const LoginAttemptSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    success: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// Auto-expire old attempt logs — only the rate-limit window (minutes) needs them.
LoginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export type LoginAttemptDocument = InferSchemaType<typeof LoginAttemptSchema>;

export const LoginAttempt: Model<LoginAttemptDocument> =
  models.LoginAttempt || model<LoginAttemptDocument>("LoginAttempt", LoginAttemptSchema);
