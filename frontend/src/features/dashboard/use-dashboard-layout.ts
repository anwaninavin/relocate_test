import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_DASHBOARD_LAYOUT, mergeDashboardLayout, type WidgetConfig } from "@/features/dashboard/widget-registry";

/** Fetches the admin-configured dashboard layout, falling back to the default order
 * (everything visible) until it loads or if no layout has been saved yet. Saved data is
 * merged onto the current defaults rather than used as-is, so a widget added after the
 * layout was last saved doesn't silently disappear for having no saved entry. */
export function useDashboardLayout(): WidgetConfig[] {
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_DASHBOARD_LAYOUT);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/dashboard/layout")
      .then((res) => {
        if (!cancelled) setLayout(mergeDashboardLayout(res.widgets));
      })
      .catch(() => {
        // Keep the default layout if the fetch fails — never block the dashboard on this.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return layout;
}
