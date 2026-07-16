import { SectionCanvas } from "@/features/canvas/section-canvas";
import { sectionIndex } from "@/features/welcome/home-sections";
import type { Breakpoint, CanvasElement, HomeSectionDef } from "@/features/welcome/canvas-types";

export function HomeSectionCanvas({
  section,
  elements,
  breakpoint,
  background,
}: {
  section: HomeSectionDef;
  elements: CanvasElement[];
  breakpoint: Breakpoint;
  background?: string;
}) {
  return (
    <SectionCanvas
      section={section}
      sectionIdx={sectionIndex(section.id)}
      elements={elements}
      breakpoint={breakpoint}
      background={background}
    />
  );
}
