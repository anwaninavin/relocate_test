import type { ListingType } from "@/types";

export interface AdminListingDTO {
  id: string;
  type: ListingType;
  city: string;
  title: string;
  imageUrl: string | null;
  rent: number | null;
  deposit: number | null;
  address: string;
  contactName: string;
  contactPhone: string;
  mapsLink: string | null;
  description: string;
  featured: boolean;
}

export interface AdminListingRaw {
  _id: string;
  type: ListingType;
  city: string;
  title: string;
  imageUrl?: string | null;
  rent?: number | null;
  deposit?: number | null;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  mapsLink?: string | null;
  description?: string;
  featured: boolean;
}

export function toAdminListingDTO(raw: AdminListingRaw): AdminListingDTO {
  return {
    id: raw._id,
    type: raw.type,
    city: raw.city,
    title: raw.title,
    imageUrl: raw.imageUrl ?? null,
    rent: raw.rent ?? null,
    deposit: raw.deposit ?? null,
    address: raw.address ?? "",
    contactName: raw.contactName ?? "",
    contactPhone: raw.contactPhone ?? "",
    mapsLink: raw.mapsLink ?? null,
    description: raw.description ?? "",
    featured: raw.featured,
  };
}
