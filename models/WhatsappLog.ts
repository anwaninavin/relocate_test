import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const WhatsappLogSchema = new Schema(
  {
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    mobile: { type: String, required: true, index: true },
    type: { type: String, default: "text" },
    body: { type: String, default: "" },
    status: { type: String, default: "sent" },
    providerMessageId: { type: String, default: null },
    raw: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export type WhatsappLogDocument = InferSchemaType<typeof WhatsappLogSchema>;

export const WhatsappLog: Model<WhatsappLogDocument> =
  models.WhatsappLog || model<WhatsappLogDocument>("WhatsappLog", WhatsappLogSchema);
