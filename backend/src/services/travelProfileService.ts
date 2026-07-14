import { connectDB } from "@/db";
import { TravelProfile } from "@/models/TravelProfile";
import type { TravelProfileInput } from "@/validations/discovery";

export async function getMyTravelProfile(userId: string) {
  await connectDB();
  return TravelProfile.findOne({ userId }).lean();
}

/** Creates or updates the caller's single discovery profile — Co-Packer and Roommate
 * discovery both read from this one document. */
export async function upsertMyTravelProfile(userId: string, input: TravelProfileInput) {
  await connectDB();
  return TravelProfile.findOneAndUpdate(
    { userId },
    { $set: { ...input, userId } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

export async function deleteMyTravelProfile(userId: string) {
  await connectDB();
  return TravelProfile.deleteOne({ userId });
}
