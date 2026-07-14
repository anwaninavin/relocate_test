import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CONNECTION_STATUSES, DISCOVERY_CONTEXTS } from "@/types";

/** A "Connect"/"Send Request" between two users from Co-Packer or Roommate discovery.
 * Shared by both features — the request/accept/decline shape doesn't differ between them,
 * only the `context` they were sent from. */
const ConnectionSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    context: { type: String, enum: DISCOVERY_CONTEXTS, required: true },
    status: { type: String, enum: CONNECTION_STATUSES, default: "pending", index: true },
    message: { type: String, default: null, trim: true, maxlength: 300 },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One request per (requester, recipient, context) — resending after a decline reuses the
// same document rather than piling up duplicates.
ConnectionSchema.index({ requesterId: 1, recipientId: 1, context: 1 }, { unique: true });
ConnectionSchema.index({ recipientId: 1, status: 1 });

export type ConnectionDocument = InferSchemaType<typeof ConnectionSchema>;

export const Connection: Model<ConnectionDocument> =
  models.Connection || model<ConnectionDocument>("Connection", ConnectionSchema);
