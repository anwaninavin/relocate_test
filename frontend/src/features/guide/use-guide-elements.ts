import { useCanvasDesign } from "@/features/canvas/use-canvas-design";
import { DEFAULT_GUIDE_ELEMENTS } from "@/features/guide/guide-elements-default";
import { mergeGuideElements, mergeGuideSectionBackgrounds } from "@/features/guide/guide-elements-merge";
import type { CanvasElement } from "@/features/welcome/canvas-types";

export function useGuideDesign(): {
  elements: CanvasElement[];
  sectionBackgrounds: Record<string, string>;
  loading: boolean;
} {
  return useCanvasDesign(
    "survival-guide",
    DEFAULT_GUIDE_ELEMENTS,
    mergeGuideElements,
    mergeGuideSectionBackgrounds,
  );
}
