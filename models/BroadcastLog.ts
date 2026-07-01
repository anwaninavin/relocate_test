import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BroadcastLogSchema = new Schema(
  {
    message: { type: String, required: true, maxlength: 1000 },
    audience: { type: String, enum: ["all", "incomplete-checklist"], default: "all" },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export type BroadcastLogDocument = InferSchemaType<typeof BroadcastLogSchema>;

export const BroadcastLog: Model<BroadcastLogDocument> =
  models.BroadcastLog || model<BroadcastLogDocument>("BroadcastLog", BroadcastLogSchema);
