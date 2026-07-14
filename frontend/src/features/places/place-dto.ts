import type { PlaceCategory } from "@/types";

export interface PlaceDTO {
  id: string;
  city: string;
  category: PlaceCategory;
  name: string;
  imageUrl: string | null;
  rating: number | null;
  address: string;
  mapsLink: string | null;
  openingHours: string;
  description: string;
  featured: boolean;
}

export interface PlaceRaw {
  _id: string;
  city: string;
  category: PlaceCategory;
  name: string;
  imageUrl?: string | null;
  rating?: number | null;
  address?: string;
  mapsLink?: string | null;
  openingHours?: string;
  description?: string;
  featured: boolean;
}

export function toPlaceDTO(raw: PlaceRaw): PlaceDTO {
  return {
    id: raw._id,
    city: raw.city,
    category: raw.category,
    name: raw.name,
    imageUrl: raw.imageUrl ?? null,
    rating: raw.rating ?? null,
    address: raw.address ?? "",
    mapsLink: raw.mapsLink ?? null,
    openingHours: raw.openingHours ?? "",
    description: raw.description ?? "",
    featured: raw.featured,
  };
}
