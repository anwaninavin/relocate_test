import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_DASHBOARD_LAYOUT, type WidgetConfig } from "@/features/dashboard/widget-registry";

/** Fetches the admin-configured dashboard layout, falling back to the default order
 * (everything visible) until it loads or if no layout has been saved yet. */
export function useDashboardLayout(): WidgetConfig[] {
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_DASHBOARD_LAYOUT);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/dashboard/layout")
      .then((res) => {
        if (!cancelled && res.widgets && res.widgets.length > 0) {
          setLayout(res.widgets);
        }
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
