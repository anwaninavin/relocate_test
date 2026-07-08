import { CanvasElementView } from "@/features/welcome/canvas-element-view";
import { sectionIndex } from "@/features/welcome/home-sections";
import { CANVAS_WIDTH } from "@/features/welcome/canvas-types";
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
  const { width, height } = section.canvas[breakpoint];
  const idx = sectionIndex(section.id);
  const sectionElements = elements.filter((e) => e.section === idx);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      // Capped at the same width the admin editor previews at (CANVAS_WIDTH) — without this,
      // this section would stretch to the full browser width on any monitor wider than that,
      // making stickers/text look progressively smaller than what the admin saw while
      // editing, the reported "admin preview doesn't match the live site" mismatch.
      style={{
        aspectRatio: `${width} / ${height}`,
        background: background ?? section.background,
        maxWidth: CANVAS_WIDTH[breakpoint],
      }}
    >
      {sectionElements.map((element) => (
        <CanvasElementView key={element.id} element={element} breakpoint={breakpoint} />
      ))}
    </div>
  );
}
