import { DEFAULT_GUIDE_ELEMENTS } from "@/features/guide/guide-elements-default";
import { GUIDE_SECTIONS } from "@/features/guide/guide-sections";
import * as canvasMerge from "@/features/canvas/canvas-merge";
import type { CanvasElement, ElementOverride, SectionBackgroundOverride } from "@/features/welcome/canvas-types";

export function mergeGuideElements(overrides: ElementOverride[] | null | undefined): CanvasElement[] {
  return canvasMerge.mergeElements(DEFAULT_GUIDE_ELEMENTS, overrides);
}

export function diffGuideElements(edited: CanvasElement[]): ElementOverride[] {
  return canvasMerge.diffElements(DEFAULT_GUIDE_ELEMENTS, edited);
}

export function mergeGuideSectionBackgrounds(
  overrides: SectionBackgroundOverride[] | null | undefined,
): Record<string, string> {
  return canvasMerge.mergeSectionBackgrounds(GUIDE_SECTIONS, overrides);
}

export function diffGuideSectionBackgrounds(edited: Record<string, string>): SectionBackgroundOverride[] {
  return canvasMerge.diffSectionBackgrounds(GUIDE_SECTIONS, edited);
}
