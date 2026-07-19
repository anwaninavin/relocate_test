import { connectDB } from "@/db";
import { Listing } from "@/models/Listing";
import { escapeRegex } from "@/lib/regex";
import type { ListingType } from "@/types";
import type { ListingInput, ListingUpdateInput } from "@/validations/admin";

/** `city` is required for the public "Hostel, PG, Flat" listing but optional for admin management,
 * where seeing every listing across every city is the point. */
export async function listListings(city?: string, type?: ListingType, search?: string) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (city) filter.city = new RegExp(`^${city}$`, "i");
  if (type) filter.type = type;
  if (search) filter.title = new RegExp(escapeRegex(search), "i");

  return Listing.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
}

export async function getListingById(id: string) {
  await connectDB();
  return Listing.findById(id).lean();
}

export async function createListing(input: ListingInput) {
  await connectDB();
  return Listing.create(input);
}

export async function updateListing(input: ListingUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return Listing.findByIdAndUpdate(id, rest, { returnDocument: "after" }).lean();
}

export async function deleteListing(id: string) {
  await connectDB();
  return Listing.deleteOne({ _id: id });
}
