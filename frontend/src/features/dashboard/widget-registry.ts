export interface WidgetConfig {
  id: string;
  visible: boolean;
}

export interface DashboardWidgetDef {
  id: string;
  label: string;
}

/** Every reorderable/hideable block on the student dashboard. Order here is only the
 * fallback default — the admin-configured layout (if any) takes precedence. */
export const DASHBOARD_WIDGETS: DashboardWidgetDef[] = [
  { id: "stats", label: "Stat cards row (packing %, budget %, items remaining, wishlist)" },
  { id: "expense-tasks", label: "Expense chart & upcoming tasks" },
  { id: "category-progress", label: "Packing progress by category" },
  { id: "recent-activity", label: "Recent activity" },
];

/** Individual cards within the stats row — shown/hidden independently of each other and
 * of the row's own visibility (both must be visible for a given card to actually render). */
export const STAT_CARDS: DashboardWidgetDef[] = [
  { id: "stat-packing", label: "Packing %" },
  { id: "stat-budget", label: "Budget % spent" },
  { id: "stat-items-remaining", label: "Items remaining" },
  { id: "stat-wishlist", label: "Wishlist count" },
];

const HIDDEN_BY_DEFAULT = new Set(["category-progress", "stat-budget", "stat-wishlist"]);

export const DEFAULT_DASHBOARD_LAYOUT: WidgetConfig[] = [...DASHBOARD_WIDGETS, ...STAT_CARDS].map((w) => ({
  id: w.id,
  visible: !HIDDEN_BY_DEFAULT.has(w.id),
}));

export function widgetLabel(id: string): string {
  return (
    DASHBOARD_WIDGETS.find((w) => w.id === id)?.label ?? STAT_CARDS.find((w) => w.id === id)?.label ?? id
  );
}
