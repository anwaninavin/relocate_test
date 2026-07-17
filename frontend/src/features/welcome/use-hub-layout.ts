import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { HOME_LAYOUT_STORAGE_KEY, readPersistedLayout, writePersistedLayout } from "@/lib/layout-cache";
import { mergeHubLayout, sortedHubLayout, type HubLayoutEntry, type SavedHubWidget } from "@/features/welcome/hub-widget-registry";

export interface HubLayoutState {
  cards: HubLayoutEntry[];
  /** False only until we know the admin's real layout — i.e. on the first ever load in this
   * browser, before /api/home/layout answers and before anything has been cached. Callers must
   * render a placeholder rather than `cards` while this is false: the fallback layout has every
   * card visible in declared order, so painting it is what made hidden cards (Budget, Wishlist,
   * …) appear for a moment and then vanish once the real layout arrived. */
  ready: boolean;
}

/** Fetches the admin-configured home hub card visibility and order. Seeds from the last known
 * layout so repeat loads paint the right cards immediately and revalidate in the background;
 * only a first-ever load has to wait. Saved data is merged onto the current card set rather
 * than used as-is, so a card added after the layout was last saved doesn't silently disappear.
 * Returned entries are sorted by `order`, ready to render as-is. */
export function useHubLayout(): HubLayoutState {
  const cached = useMemo(() => readPersistedLayout<SavedHubWidget>(HOME_LAYOUT_STORAGE_KEY), []);
  // `undefined` means "we don't know yet" and is what gates `ready`; `null` is a real answer
  // ("no layout saved — defaults are correct"), so the two must not be collapsed.
  const [saved, setSaved] = useState<SavedHubWidget[] | null | undefined>(() => cached?.widgets);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: SavedHubWidget[] | null }>("/api/home/layout")
      .then((res) => {
        writePersistedLayout(HOME_LAYOUT_STORAGE_KEY, res.widgets);
        if (!cancelled) setSaved(res.widgets ?? null);
      })
      .catch(() => {
        // Never block the home page on this: fall back to the default layout, which also flips
        // `ready` so a failed fetch shows cards rather than an endless placeholder.
        if (!cancelled) setSaved((current) => (current === undefined ? null : current));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    cards: sortedHubLayout(mergeHubLayout(saved)),
    ready: saved !== undefined,
  };
}
