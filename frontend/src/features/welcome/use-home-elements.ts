import { useCanvasDesign } from "@/features/canvas/use-canvas-design";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import { mergeHomeElements, mergeSectionBackgrounds } from "@/features/welcome/home-elements-merge";
import type { CanvasElement } from "@/features/welcome/canvas-types";

export function useHomeDesign(): {
  elements: CanvasElement[];
  sectionBackgrounds: Record<string, string>;
  loading: boolean;
} {
  return useCanvasDesign("home", DEFAULT_HOME_ELEMENTS, mergeHomeElements, mergeSectionBackgrounds);
}
