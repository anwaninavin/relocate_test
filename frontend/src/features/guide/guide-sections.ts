import type { HomeSectionDef } from "@/features/welcome/canvas-types";
import { SECTION_BACKGROUND_PRESETS } from "@/features/welcome/section-background-presets";

/** Every section shares one canvas size per breakpoint, same convention as the home screen —
 * see home-sections.ts for why (consistent, predictable sizing in both the admin editor and
 * the live page). Guide sections tend to hold a bit more content than home's, so the canvas
 * is a little taller. */
const MOBILE_CANVAS = { width: 393, height: 950 };
const DESKTOP_CANVAS = { width: 1400, height: 820 };

export const GUIDE_SECTIONS: HomeSectionDef[] = [
  {
    id: "hero",
    label: "Hero",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.sunrise,
  },
  {
    id: "intro",
    label: "Intro",
    canvas: { mobile: { width: 393, height: 500 }, desktop: { width: 1400, height: 360 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "mental-prep",
    label: "Mental Prep",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "room-setup",
    label: "Room Setup",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "electronics",
    label: "Power & Gadgets",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "bathroom",
    label: "Bathroom",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "laundry",
    label: "Clothing & Laundry",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "food",
    label: "Food",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "roommates",
    label: "Roommates",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "hygiene",
    label: "Hygiene",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "safety",
    label: "Safety",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "routine",
    label: "Routine",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "social",
    label: "Social Life",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "money",
    label: "Money",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "essentials",
    label: "Essentials",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "final",
    label: "Final",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.dusk,
  },
];

export function guideSectionIndex(id: string): number {
  return GUIDE_SECTIONS.findIndex((s) => s.id === id);
}
