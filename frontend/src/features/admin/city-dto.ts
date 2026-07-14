export interface AdminCityDTO {
  id: string;
  name: string;
  state: string;
  imageUrl: string | null;
  featured: boolean;
}

export interface AdminCityRaw {
  _id: string;
  name: string;
  state?: string;
  imageUrl?: string | null;
  featured: boolean;
}

export function toAdminCityDTO(raw: AdminCityRaw): AdminCityDTO {
  return {
    id: raw._id,
    name: raw.name,
    state: raw.state ?? "",
    imageUrl: raw.imageUrl ?? null,
    featured: raw.featured,
  };
}
