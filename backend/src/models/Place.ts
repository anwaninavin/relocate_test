import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { PLACE_CATEGORIES } from "@/types";

/** Admin-managed "Places to Explore" entries, following the same CMS shape as GuideArticle
 * (category/order/content) plus location fields. No maps SDK is installed in this project —
 * `mapsLink` is a plain Google Maps search/place URL, not an API integration. */
const PlaceSchema = new Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    category: { type: String, enum: PLACE_CATEGORIES, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    imageUrl: { type: String, default: null },
    rating: { type: Number, default: null, min: 0, max: 5 },
    address: { type: String, default: "", trim: true, maxlength: 300 },
    mapsLink: { type: String, default: null, trim: true, maxlength: 500 },
    openingHours: { type: String, default: "", trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PlaceSchema.index({ city: 1, category: 1 });

export type PlaceDocument = InferSchemaType<typeof PlaceSchema>;

export const Place: Model<PlaceDocument> = models.Place || model<PlaceDocument>("Place", PlaceSchema);
