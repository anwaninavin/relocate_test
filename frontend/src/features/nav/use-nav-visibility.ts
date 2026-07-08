import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_NAV_VISIBILITY } from "@/features/nav/nav-visibility";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

/** Fetches the admin-configured nav item visibility, falling back to the default (some
 * items hidden until an admin turns them back on) until it loads or if nothing's saved yet.
 * Returns the set of hrefs that should be hidden from every nav surface. */
export function useHiddenNavHrefs(): Set<string> {
  const [config, setConfig] = useState<WidgetConfig[]>(DEFAULT_NAV_VISIBILITY);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/nav/layout")
      .then((res) => {
        if (!cancelled && res.widgets && res.widgets.length > 0) {
          setConfig(res.widgets);
        }
      })
      .catch(() => {
        // Keep the default visibility if the fetch fails — never block navigation on this.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return new Set(config.filter((w) => !w.visible).map((w) => w.id));
}
