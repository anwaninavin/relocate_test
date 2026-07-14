import type { AccommodationType, Gender } from "@/types";

export interface TravelProfileDTO {
  currentCity: string;
  destinationCity: string;
  travelMonth: string;
  arrivalDate: string | null;
  college: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  accommodationType: AccommodationType | null;
  genderPreference: Gender | "Any";
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  interests: string[];
  languages: string[];
  lifestyleTags: string[];
  visibility: {
    hideProfile: boolean;
    onlyShowVerified: boolean;
    onlyShowSameGender: boolean;
  };
  active: boolean;
}

export interface TravelProfileRaw extends Partial<TravelProfileDTO> {
  _id?: string;
}

export function toTravelProfileDTO(raw: TravelProfileRaw | null): TravelProfileDTO {
  return {
    currentCity: raw?.currentCity ?? "",
    destinationCity: raw?.destinationCity ?? "",
    travelMonth: raw?.travelMonth ?? "",
    arrivalDate: raw?.arrivalDate ?? null,
    college: raw?.college ?? null,
    budgetMin: raw?.budgetMin ?? null,
    budgetMax: raw?.budgetMax ?? null,
    accommodationType: raw?.accommodationType ?? null,
    genderPreference: raw?.genderPreference ?? "Any",
    ageRangeMin: raw?.ageRangeMin ?? null,
    ageRangeMax: raw?.ageRangeMax ?? null,
    interests: raw?.interests ?? [],
    languages: raw?.languages ?? [],
    lifestyleTags: raw?.lifestyleTags ?? [],
    visibility: {
      hideProfile: raw?.visibility?.hideProfile ?? false,
      onlyShowVerified: raw?.visibility?.onlyShowVerified ?? false,
      onlyShowSameGender: raw?.visibility?.onlyShowSameGender ?? false,
    },
    active: raw?.active ?? true,
  };
}

export interface DiscoveryCardDTO {
  userId: string;
  name: string | null;
  avatar: string | null;
  gender: Gender | null;
  verified: boolean;
  college: string | null;
  currentCity: string;
  destinationCity: string;
  travelMonth: string;
  arrivalDate: string | null;
  accommodationType: AccommodationType | null;
  budgetMin: number | null;
  budgetMax: number | null;
  interests: string[];
  languages: string[];
  lifestyleTags: string[];
  age: number | null;
  compatibilityScore?: number;
}

interface PopulatedUser {
  _id: string;
  name: string | null;
  avatar: string | null;
  gender: Gender | null;
  college: string | null;
  verified: boolean;
}

export interface ConnectionRequestDTO {
  id: string;
  status: "pending" | "accepted" | "declined";
  context: "co_packer" | "roommate";
  message: string | null;
  createdAt: string;
  otherUser: PopulatedUser;
}

export interface ConnectionRequestRaw {
  _id: string;
  status: "pending" | "accepted" | "declined";
  context: "co_packer" | "roommate";
  message: string | null;
  createdAt: string;
  requesterId: PopulatedUser;
  recipientId: PopulatedUser;
}

export function toIncomingRequestDTO(raw: ConnectionRequestRaw): ConnectionRequestDTO {
  return {
    id: raw._id,
    status: raw.status,
    context: raw.context,
    message: raw.message,
    createdAt: raw.createdAt,
    otherUser: raw.requesterId,
  };
}

export function toOutgoingRequestDTO(raw: ConnectionRequestRaw): ConnectionRequestDTO {
  return {
    id: raw._id,
    status: raw.status,
    context: raw.context,
    message: raw.message,
    createdAt: raw.createdAt,
    otherUser: raw.recipientId,
  };
}

export function toAcceptedConnectionDTO(raw: ConnectionRequestRaw, myUserId: string): ConnectionRequestDTO {
  const otherUser = raw.requesterId._id === myUserId ? raw.recipientId : raw.requesterId;
  return {
    id: raw._id,
    status: raw.status,
    context: raw.context,
    message: raw.message,
    createdAt: raw.createdAt,
    otherUser,
  };
}
