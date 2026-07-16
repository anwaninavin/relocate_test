import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import { HOME_SECTIONS } from "@/features/welcome/home-sections";
import * as canvasMerge from "@/features/canvas/canvas-merge";
import type { CanvasElement, ElementOverride, SectionBackgroundOverride } from "@/features/welcome/canvas-types";

export function mergeHomeElements(overrides: ElementOverride[] | null | undefined): CanvasElement[] {
  return canvasMerge.mergeElements(DEFAULT_HOME_ELEMENTS, overrides);
}

export function diffHomeElements(edited: CanvasElement[]): ElementOverride[] {
  return canvasMerge.diffElements(DEFAULT_HOME_ELEMENTS, edited);
}

export function mergeSectionBackgrounds(
  overrides: SectionBackgroundOverride[] | null | undefined,
): Record<string, string> {
  return canvasMerge.mergeSectionBackgrounds(HOME_SECTIONS, overrides);
}

export function diffSectionBackgrounds(edited: Record<string, string>): SectionBackgroundOverride[] {
  return canvasMerge.diffSectionBackgrounds(HOME_SECTIONS, edited);
}
