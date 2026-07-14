import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { initAnalyticsClient, trackPageView } from "@/lib/analytics/client";

/** Mounted once near the app root — wires up delegated click/form/scroll listeners and
 * fires a page_view on every route change (initial load included). */
export function useAnalyticsPageViews() {
  const location = useLocation();

  useEffect(() => {
    initAnalyticsClient();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
}
