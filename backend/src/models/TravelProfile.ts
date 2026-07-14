import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { ACCOMMODATION_TYPES, GENDER_OPTIONS } from "@/types";

/** One discovery profile per user, powering both Co-Packer and Roommate discovery — they're
 * the same underlying "where/when am I travelling and what am I looking for" data, just
 * queried with different filters, so this is a single collection rather than two (see the
 * Atlas collection-cap constraint noted on User.loginAttempts). Opt-in only: a user is
 * discoverable only once they've saved a profile with `active: true`. */
const TravelProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    currentCity: { type: String, required: true, trim: true, maxlength: 80, index: true },
    destinationCity: { type: String, required: true, trim: true, maxlength: 80, index: true },
    /** "YYYY-MM" — the Co-Packer matching granularity ("Travel Month"). */
    travelMonth: { type: String, required: true, index: true },
    arrivalDate: { type: Date, default: null, index: true },

    college: { type: String, default: null, trim: true, maxlength: 120 },
    budgetMin: { type: Number, default: null, min: 0 },
    budgetMax: { type: Number, default: null, min: 0 },
    accommodationType: { type: String, enum: ACCOMMODATION_TYPES, default: null },

    genderPreference: { type: String, enum: [...GENDER_OPTIONS, "Any"], default: "Any" },
    ageRangeMin: { type: Number, default: null, min: 16, max: 100 },
    ageRangeMax: { type: Number, default: null, min: 16, max: 100 },

    interests: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    lifestyleTags: { type: [String], default: [] },

    visibility: {
      hideProfile: { type: Boolean, default: false },
      onlyShowVerified: { type: Boolean, default: false },
      onlyShowSameGender: { type: Boolean, default: false },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TravelProfileSchema.index({ destinationCity: 1, travelMonth: 1 });
TravelProfileSchema.index({ destinationCity: 1, arrivalDate: 1 });
/** Fully covers findCoPackers' mandatory match (destinationCity + travelMonth + currentCity +
 * active) so it doesn't fall back to filtering the last two fields in memory. */
TravelProfileSchema.index({ destinationCity: 1, travelMonth: 1, currentCity: 1, active: 1 });
/** Covers findRoommates' mandatory match (destinationCity + active). */
TravelProfileSchema.index({ destinationCity: 1, active: 1 });

export type TravelProfileDocument = InferSchemaType<typeof TravelProfileSchema>;

export const TravelProfile: Model<TravelProfileDocument> =
  models.TravelProfile || model<TravelProfileDocument>("TravelProfile", TravelProfileSchema);
