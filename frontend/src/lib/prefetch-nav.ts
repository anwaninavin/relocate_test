import { api } from "@/lib/api";

interface PrefetchTarget {
  /** Mirrors the lazy() import in App.tsx — calling the same dynamic import ahead of time warms
   * the browser's module/chunk cache, so React.lazy's own import() resolves instantly (no
   * network wait) when the user actually taps the tab. */
  page: () => Promise<unknown>;
  /** The GETs this destination's initial render depends on — warms lib/api.ts's response cache
   * so the page's own fetch resolves from cache instead of the network on first visit. */
  data?: string[];
}

/** Keyed by the nav href that exposes each destination, so the warm-up can be limited to what
 * this install's admin actually surfaces. */
const PREFETCH_BY_HREF: Record<string, PrefetchTarget> = {
  "/dashboard": { page: () => import("@/pages/dashboard-page"), data: ["/api/dashboard"] },
  "/checklist": { page: () => import("@/pages/checklist-page"), data: ["/api/checklist"] },
  "/bags": { page: () => import("@/pages/bags-page"), data: ["/api/bags"] },
  "/budget": { page: () => import("@/pages/budget-page"), data: ["/api/budget", "/api/budget/summary"] },
  "/notes": { page: () => import("@/pages/notes-page"), data: ["/api/notes"] },
  "/documents": { page: () => import("@/pages/documents-page"), data: ["/api/documents"] },
  "/contacts": { page: () => import("@/pages/contacts-page"), data: ["/api/contacts"] },
  "/wishlist": { page: () => import("@/pages/wishlist-page"), data: ["/api/wishlist"] },
  "/shopping": { page: () => import("@/pages/shopping-page"), data: ["/api/products"] },
  "/discover": { page: () => import("@/pages/discover-page"), data: ["/api/discovery/profile"] },
  "/explore": { page: () => import("@/pages/explore-page") },
  "/bookings": { page: () => import("@/pages/bookings-page"), data: ["/api/bookings"] },
  "/community": { page: () => import("@/pages/community-page") },
  "/chat": { page: () => import("@/pages/chat-page") },
  "/guide/survival-guide": { page: () => import("@/pages/survival-guide-page"), data: ["/api/guide"] },
};

/** Destinations no admin can hide, so they're always worth warming: Settings is a system nav
 * entry (always pinned — see CONFIGURABLE_NAV_ITEMS), /guide is reachable from the survival
 * guide rather than from a nav item of its own, and /api/categories backs the quick-add FAB's
 * checklist actions, which have no nav href to be hidden behind. */
const ALWAYS_PREFETCH: PrefetchTarget[] = [
  { page: () => import("@/pages/settings-page") },
  { page: () => import("@/pages/guide-page"), data: ["/api/categories"] },
];

let prefetched = false;

/** Warms each reachable nav destination's JS chunk and API data once per session, shortly after
 * the dashboard shell mounts — so switching tabs hits an already-downloaded chunk and an
 * already-cached response instead of paying for both on first visit.
 *
 * `visibleHrefs` scopes this to what the user can actually reach. Warming everything regardless
 * meant a typical install spent most of this budget on features its admin had hidden — chunks
 * that can never be routed to and authenticated GETs that each cost a real DB round-trip
 * against a backend that may be a continent away. A destination hidden from the nav but still
 * linked from a home card just loads cold; prefetching is an optimization, never a
 * prerequisite.
 *
 * Errors are swallowed: this is a best-effort background warm-up, not a real page load, so a
 * failure here shouldn't surface a toast for a page the user hasn't even opened. */
export function prefetchNavDestinations(visibleHrefs: string[]) {
  if (prefetched) return;
  prefetched = true;

  const targets = [
    ...visibleHrefs.map((href) => PREFETCH_BY_HREF[href]).filter((t): t is PrefetchTarget => t !== undefined),
    ...ALWAYS_PREFETCH,
  ];

  const run = () => {
    for (const target of targets) {
      target.page().catch(() => {});
      for (const path of target.data ?? []) {
        api.get(path).catch(() => {});
      }
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run);
  } else {
    setTimeout(run, 1500);
  }
}
