import { PRIMARY_NAV_ITEMS } from "@/lib/nav-items";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

/** Nav items hidden by default until an admin turns them back on from the "Nav Items"
 * admin editor. */
const INITIALLY_HIDDEN_HREFS = new Set([
  "/budget",
  "/wishlist",
  "/documents",
  "/shopping",
  "/notes",
  "/contacts",
]);

export const DEFAULT_NAV_VISIBILITY: WidgetConfig[] = PRIMARY_NAV_ITEMS.map((item) => ({
  id: item.href,
  visible: !INITIALLY_HIDDEN_HREFS.has(item.href),
}));

export function navItemLabel(href: string): string {
  return PRIMARY_NAV_ITEMS.find((item) => item.href === href)?.label ?? href;
}

/** Merges an admin-saved layout onto the current nav item set: known hrefs keep their saved
 * visibility, but any nav item that exists now and wasn't in the saved data (e.g. a nav item
 * added after the layout was last saved — this is exactly what happened when Community/
 * Messages shipped after a layout had already been saved) is kept visible by default instead
 * of silently disappearing from the "Nav items" editor. Saved entries for hrefs that no
 * longer exist are dropped. Mirrors hub-widget-registry.ts's mergeHubLayout. */
export function mergeNavLayout(saved: WidgetConfig[] | null | undefined): WidgetConfig[] {
  if (!saved || saved.length === 0) return DEFAULT_NAV_VISIBILITY;

  const savedByHref = new Map(saved.map((w) => [w.id, w]));
  return PRIMARY_NAV_ITEMS.map((item) => savedByHref.get(item.href) ?? { id: item.href, visible: true });
}
