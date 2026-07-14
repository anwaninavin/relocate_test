import type { ContactCategory } from "@/types";

export interface DirectoryContactDTO {
  id: string;
  city: string;
  category: ContactCategory;
  name: string;
  phone: string;
  whatsapp: string | null;
  description: string;
  verified: boolean;
}

export interface DirectoryContactRaw {
  _id: string;
  city: string;
  category: ContactCategory;
  name: string;
  phone: string;
  whatsapp?: string | null;
  description?: string;
  verified: boolean;
}

export function toDirectoryContactDTO(raw: DirectoryContactRaw): DirectoryContactDTO {
  return {
    id: raw._id,
    city: raw.city,
    category: raw.category,
    name: raw.name,
    phone: raw.phone,
    whatsapp: raw.whatsapp ?? null,
    description: raw.description ?? "",
    verified: raw.verified,
  };
}
