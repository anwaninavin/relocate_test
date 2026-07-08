import { PRIMARY_NAV_ITEMS } from "@/lib/nav-items";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

/** Nav items hidden by default until an admin turns them back on from the "Nav Items"
 * admin editor. */
const INITIALLY_HIDDEN_HREFS = new Set(["/budget", "/wishlist", "/documents", "/shopping", "/notes"]);

export const DEFAULT_NAV_VISIBILITY: WidgetConfig[] = PRIMARY_NAV_ITEMS.map((item) => ({
  id: item.href,
  visible: !INITIALLY_HIDDEN_HREFS.has(item.href),
}));

export function navItemLabel(href: string): string {
  return PRIMARY_NAV_ITEMS.find((item) => item.href === href)?.label ?? href;
}
