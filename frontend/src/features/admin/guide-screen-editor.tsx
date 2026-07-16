import { CanvasScreenEditor } from "@/features/canvas/canvas-screen-editor";
import { GUIDE_SECTIONS } from "@/features/guide/guide-sections";
import { DEFAULT_GUIDE_ELEMENTS } from "@/features/guide/guide-elements-default";
import {
  diffGuideElements,
  diffGuideSectionBackgrounds,
  mergeGuideElements,
  mergeGuideSectionBackgrounds,
} from "@/features/guide/guide-elements-merge";

export function GuideScreenEditor() {
  return (
    <CanvasScreenEditor
      title="Guide screen"
      page="survival-guide"
      sections={GUIDE_SECTIONS}
      defaultElements={DEFAULT_GUIDE_ELEMENTS}
      mergeElements={mergeGuideElements}
      diffElements={diffGuideElements}
      mergeBackgrounds={mergeGuideSectionBackgrounds}
      diffBackgrounds={diffGuideSectionBackgrounds}
    />
  );
}
