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
  { id: "stats", label: "Stat cards (packing %, budget %, items remaining, wishlist)" },
  { id: "expense-tasks", label: "Expense chart & upcoming tasks" },
  { id: "category-progress", label: "Packing progress by category" },
  { id: "recent-activity", label: "Recent activity" },
];

export const DEFAULT_DASHBOARD_LAYOUT: WidgetConfig[] = DASHBOARD_WIDGETS.map((w) => ({
  id: w.id,
  visible: true,
}));

export function widgetLabel(id: string): string {
  return DASHBOARD_WIDGETS.find((w) => w.id === id)?.label ?? id;
}
