import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CONTACT_CATEGORIES } from "@/types";

/** A shared, city-scoped contact directory ("Discover Contacts") — distinct from the private
 * per-user EmergencyContact list. Any user can submit an entry; it's moderated via the
 * embedded `reports` array and an admin `verified` flag rather than a separate reports
 * collection (same rationale as User.loginAttempts). */
const DirectoryContactSchema = new Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    category: { type: String, enum: CONTACT_CATEGORIES, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    whatsapp: { type: String, default: null, trim: true, maxlength: 20 },
    description: { type: String, default: "", maxlength: 300 },
    addedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    verified: { type: Boolean, default: false },
    reports: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          reason: { type: String, required: true, trim: true, maxlength: 300 },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

DirectoryContactSchema.index({ city: 1, category: 1 });

export type DirectoryContactDocument = InferSchemaType<typeof DirectoryContactSchema>;

export const DirectoryContact: Model<DirectoryContactDocument> =
  models.DirectoryContact || model<DirectoryContactDocument>("DirectoryContact", DirectoryContactSchema);
