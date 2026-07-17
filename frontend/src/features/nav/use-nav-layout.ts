import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { NAV_LAYOUT_STORAGE_KEY, readPersistedLayout, writePersistedLayout } from "@/lib/layout-cache";
import { resolveNavLayout, type ResolvedNavLayout, type SavedNavWidget } from "@/features/nav/nav-layout";

export interface NavLayoutState extends ResolvedNavLayout {
  /** False only until we know the admin's real layout — i.e. on the first ever load in this
   * browser. The shipped default disagrees with a customized layout about which items exist and
   * where (e.g. it puts Discover in the bottom bar where an admin may have put Shopping), so
   * rendering it first is what makes nav entries appear and then rearrange or vanish. */
  ready: boolean;
}

/** Fetches the admin-configured nav layout (visibility, bottom-bar-vs-overflow placement, and
 * order) and resolves it into exactly what each nav surface should render. Seeds from the last
 * known layout so repeat loads paint the right nav immediately and revalidate in the
 * background; only a first-ever load has to wait. Falls back to the shipped default if the
 * fetch fails or nothing's saved yet — never blocks navigation on this request. */
export function useNavLayout(): NavLayoutState {
  const cached = useMemo(() => readPersistedLayout<SavedNavWidget>(NAV_LAYOUT_STORAGE_KEY), []);
  // `undefined` means "we don't know yet" and is what gates `ready`; `null` is a real answer
  // ("no layout saved — defaults are correct"), so the two must not be collapsed.
  const [saved, setSaved] = useState<SavedNavWidget[] | null | undefined>(() => cached?.widgets);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: SavedNavWidget[] | null }>("/api/nav/layout")
      .then((res) => {
        writePersistedLayout(NAV_LAYOUT_STORAGE_KEY, res.widgets);
        if (!cancelled) setSaved(res.widgets ?? null);
      })
      .catch(() => {
        // Keep the default layout if the fetch fails — this also flips `ready`, so a failed
        // fetch leaves the user with a usable nav rather than a permanently empty one.
        if (!cancelled) setSaved((current) => (current === undefined ? null : current));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ ...resolveNavLayout(saved), ready: saved !== undefined }), [saved]);
}
