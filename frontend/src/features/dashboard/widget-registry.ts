export interface WidgetConfig {
  id: string;
  visible: boolean;
}

export interface DashboardWidgetDef {
  id: string;
  label: string;
}

/** Every independently hideable piece of the student dashboard, as one flat list — no
 * grouping, so an admin can control each one on its own. `reorderable` marks the pieces
 * that also appear in the admin's drag-to-reorder list; the 4 stat cards always render
 * together at the top in a fixed order (toggled individually, not reordered). */
export const DASHBOARD_WIDGETS: DashboardWidgetDef[] = [
  { id: "stat-packing", label: "Packing %" },
  { id: "stat-budget", label: "Budget % spent" },
  { id: "stat-items-remaining", label: "Items remaining" },
  { id: "stat-wishlist", label: "Wishlist count" },
  { id: "expense-chart", label: "Spending by category chart" },
  { id: "upcoming-tasks", label: "Upcoming tasks" },
  { id: "category-progress", label: "Packing progress by category" },
  { id: "recent-activity", label: "Recent activity" },
];

export const STAT_CARD_IDS = ["stat-packing", "stat-budget", "stat-items-remaining", "stat-wishlist"];

export const REORDERABLE_WIDGET_IDS = ["expense-chart", "upcoming-tasks", "category-progress", "recent-activity"];

const HIDDEN_BY_DEFAULT = new Set(["stat-budget", "stat-wishlist", "category-progress"]);

export const DEFAULT_DASHBOARD_LAYOUT: WidgetConfig[] = DASHBOARD_WIDGETS.map((w) => ({
  id: w.id,
  visible: !HIDDEN_BY_DEFAULT.has(w.id),
}));

export function widgetLabel(id: string): string {
  return DASHBOARD_WIDGETS.find((w) => w.id === id)?.label ?? id;
}

/** Merges an admin-saved layout onto the current default set: known ids keep their saved
 * visibility (and, for reorderable ids, their saved order), but any id that exists in the
 * defaults and *not* in the saved data (e.g. a widget added after the layout was last saved)
 * is appended with its default visibility instead of silently vanishing. Saved entries for
 * ids that no longer exist (e.g. a since-removed grouped widget) are dropped. */
export function mergeDashboardLayout(saved: WidgetConfig[] | null | undefined): WidgetConfig[] {
  if (!saved || saved.length === 0) return DEFAULT_DASHBOARD_LAYOUT;

  const knownIds = new Set(DASHBOARD_WIDGETS.map((w) => w.id));
  const savedById = new Map(saved.map((w) => [w.id, w]));

  const merged: WidgetConfig[] = [];
  for (const s of saved) {
    if (knownIds.has(s.id)) merged.push({ id: s.id, visible: s.visible });
  }
  for (const d of DEFAULT_DASHBOARD_LAYOUT) {
    if (!savedById.has(d.id)) merged.push(d);
  }
  return merged;
}
