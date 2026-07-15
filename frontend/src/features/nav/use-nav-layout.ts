import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { resolveNavLayout, type ResolvedNavLayout } from "@/features/nav/nav-layout";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

/** Fetches the admin-configured nav layout (visibility, bottom-bar-vs-overflow placement,
 * and order) and resolves it into exactly what each nav surface should render. Falls back to
 * the shipped default until it loads or if nothing's saved yet — never blocks navigation on
 * this request. */
export function useNavLayout(): ResolvedNavLayout {
  const [saved, setSaved] = useState<WidgetConfig[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/nav/layout")
      .then((res) => {
        if (!cancelled) setSaved(res.widgets);
      })
      .catch(() => {
        // Keep the default layout if the fetch fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => resolveNavLayout(saved), [saved]);
}
