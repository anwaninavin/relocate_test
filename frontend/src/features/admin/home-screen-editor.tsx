import { CanvasScreenEditor } from "@/features/canvas/canvas-screen-editor";
import { HOME_SECTIONS } from "@/features/welcome/home-sections";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import {
  diffHomeElements,
  diffSectionBackgrounds,
  mergeHomeElements,
  mergeSectionBackgrounds,
} from "@/features/welcome/home-elements-merge";

export function HomeScreenEditor() {
  return (
    <CanvasScreenEditor
      title="Home screen"
      page="home"
      sections={HOME_SECTIONS}
      defaultElements={DEFAULT_HOME_ELEMENTS}
      mergeElements={mergeHomeElements}
      diffElements={diffHomeElements}
      mergeBackgrounds={mergeSectionBackgrounds}
      diffBackgrounds={diffSectionBackgrounds}
    />
  );
}
