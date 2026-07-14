import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Small, admin-managed reference list of cities — powers the city picker/autocomplete used
 * across discovery profiles, bookings, and places, plus "Featured Locations." Low document
 * count by nature (tens, not thousands), so kept as its own lightweight collection rather
 * than folded into Place — if the Atlas collection budget gets tighter, this is the first
 * candidate to merge into Place as `category: "city"`. */
const CitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    state: { type: String, default: "", trim: true, maxlength: 80 },
    imageUrl: { type: String, default: null },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type CityDocument = InferSchemaType<typeof CitySchema>;

export const City: Model<CityDocument> = models.City || model<CityDocument>("City", CitySchema);
