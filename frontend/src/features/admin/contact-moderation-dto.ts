import type { ContactCategory } from "@/types";

export interface ReportedContactDTO {
  id: string;
  city: string;
  category: ContactCategory;
  name: string;
  phone: string;
  verified: boolean;
  reports: { reason: string; createdAt: string }[];
}

export interface ReportedContactRaw {
  _id: string;
  city: string;
  category: ContactCategory;
  name: string;
  phone: string;
  verified: boolean;
  reports: { reason: string; createdAt: string }[];
}

export function toReportedContactDTO(raw: ReportedContactRaw): ReportedContactDTO {
  return {
    id: raw._id,
    city: raw.city,
    category: raw.category,
    name: raw.name,
    phone: raw.phone,
    verified: raw.verified,
    reports: raw.reports ?? [],
  };
}
