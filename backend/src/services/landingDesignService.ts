import { connectDB } from "@/db";
import { LandingDesign } from "@/models/LandingDesign";

export interface ElementLayoutOverride {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  visible?: boolean;
  zIndex?: number;
}

export interface ElementOverride {
  id: string;
  section?: number;
  kind?: "image" | "card";
  src?: string;
  alt?: string;
  emoji?: string;
  lines?: string[];
  ctaLabel?: string;
  href?: string;
  background?: string;
  shape?: string;
  textStyle?: string;
  textColor?: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
  bold?: boolean;
  isCustom?: boolean;
  layouts?: {
    mobile?: ElementLayoutOverride;
    desktop?: ElementLayoutOverride;
  };
}

export interface SectionBackgroundOverride {
  id: string;
  background: string;
}

export interface LandingDesignData {
  elements: ElementOverride[] | null;
  sectionBackgrounds: SectionBackgroundOverride[] | null;
}

export const LANDING_PAGES = ["home", "survival-guide"] as const;
export type LandingPage = (typeof LANDING_PAGES)[number];

/** Public — both the home screen and the survival guide are shown to signed-out visitors. */
export async function getLandingDesign(page: LandingPage): Promise<LandingDesignData> {
  await connectDB();
  const doc = await LandingDesign.findOne({ page }).lean();
  // Mongoose's inferred lean() type marks optional nested fields as `T | null` (from its
  // own schema typing) rather than `T | undefined` as declared here — the shapes are
  // runtime-compatible (both mean "absent"), so this cast just bridges that gap.
  return {
    elements: (doc?.elements as unknown as ElementOverride[] | undefined) ?? null,
    sectionBackgrounds: (doc?.sectionBackgrounds as unknown as SectionBackgroundOverride[] | undefined) ?? null,
  };
}

/** Admin-only: persists the drag/resize/rotate/hide/text overrides and section background
 * choices for a landing page (the home screen or the survival guide). */
export async function saveLandingDesign(
  page: LandingPage,
  elements: ElementOverride[],
  sectionBackgrounds: SectionBackgroundOverride[],
): Promise<LandingDesignData> {
  await connectDB();
  await LandingDesign.findOneAndUpdate(
    { page },
    { elements, sectionBackgrounds },
    { upsert: true },
  );
  return { elements, sectionBackgrounds };
}
