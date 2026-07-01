import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const LoginTicketSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    expectedMobile: { type: String, required: true, index: true },
    verifiedMobile: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "verified", "consumed", "expired"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    requestIp: { type: String, default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export type LoginTicketDocument = InferSchemaType<typeof LoginTicketSchema>;

export const LoginTicket: Model<LoginTicketDocument> =
  models.LoginTicket || model<LoginTicketDocument>("LoginTicket", LoginTicketSchema);
