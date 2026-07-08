/** One breakpoint's placement for a canvas element. Position is percent-based and
 * center-anchored (like the existing ImageSticker convention) so it scales with the
 * canvas regardless of device width. */
export interface ElementLayout {
  x: number; // percent, center of element, left edge of section canvas = 0
  y: number; // percent, center of element, top edge of section canvas = 0
  scale: number; // 1 = the element's default size
  rotation: number; // degrees
  visible: boolean;
  zIndex: number; // paint order within the section — higher renders in front
}

export type CardBackground = "yellow" | "pink" | "blue" | "lavender" | "white" | "none" | "dark";
export type CardShape = "sticky" | "polaroid" | "bubble-left" | "bubble-right" | "torn" | "plain" | "quote";

/** A single draggable/resizable/rotatable/removable unit on the home screen. Whole
 * cards/stickers are the editing unit (not individual words inside a card) — text is
 * edited as a block of lines via the admin side panel. */
export interface CanvasElement {
  id: string;
  section: number; // index into HOME_SECTIONS
  kind: "image" | "card";
  // image kind
  src?: string;
  alt?: string;
  // card kind
  emoji?: string;
  lines?: string[];
  ctaLabel?: string;
  href?: string;
  background?: CardBackground;
  shape?: CardShape;
  textStyle?: "heading" | "body" | "quote";
  /** Marks one line as a distinctly-styled aside (rotated, colored, handwritten) instead
   * of the generic body-text look — e.g. the "NOPE HOURS" callout under a headline. */
  specialLine?: number;
  /** Targets a substring within one line for a decorative accent: a colored marker
   * highlight, or (with decoration: "circle") a hand-drawn circle around it instead. */
  highlight?: { line: number; substring: string; color?: string };
  /** Decorative accent carried over from the original design. "arrow" is a standalone
   * scribble above the text; "circle" circles `highlight.substring` instead of marking it. */
  decoration?: "arrow" | "circle";
  /** Admin-editable text styling, applied uniformly to every line in this card. Unset
   * means "use the built-in default look" (whatever CardContent normally applies). */
  textColor?: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
  bold?: boolean;
  /** True for elements an admin added (uploaded sticker or blank card) rather than one of
   * the built-in defaults — these have no default to fall back to, so they're deleted
   * outright instead of hidden/reset, and always saved in full rather than as a diff. */
  isCustom?: boolean;
  layouts: {
    mobile: ElementLayout;
    desktop: ElementLayout;
  };
}

export interface HomeSectionDef {
  id: string;
  label: string;
  /** Reference canvas size elements are positioned against, per breakpoint. */
  canvas: {
    mobile: { width: number; height: number };
    desktop: { width: number; height: number };
  };
  background?: string; // CSS background value
}

export type Breakpoint = "mobile" | "desktop";

/** Real device widths (CSS px) each breakpoint's canvas is designed at — shared by the
 * admin editor's preview and the live public page, so the two can never drift out of sync.
 * The live page caps its section width at this value (instead of stretching edge-to-edge on
 * wide monitors) so what the admin sees while editing matches what visitors actually see. */
export const CANVAS_WIDTH: Record<Breakpoint, number> = { mobile: 390, desktop: 1280 };

/** What the backend stores per element. For built-in elements this is a sparse diff
 * (only changed fields); for admin-added custom elements it carries every field needed
 * to fully reconstruct the element, since there's no default to merge onto. */
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
  background?: CardBackground;
  shape?: CardShape;
  textStyle?: "heading" | "body" | "quote";
  textColor?: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
  bold?: boolean;
  isCustom?: boolean;
  layouts?: {
    mobile?: Partial<ElementLayout>;
    desktop?: Partial<ElementLayout>;
  };
}

/** Admin-chosen background (any CSS `background` value) for one section, overriding its
 * default. Same background is used at every breakpoint. */
export interface SectionBackgroundOverride {
  id: string;
  background: string;
}
