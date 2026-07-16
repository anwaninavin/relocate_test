import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { CanvasElement, ElementOverride, SectionBackgroundOverride } from "@/features/welcome/canvas-types";

interface LandingDesignResponse {
  elements: ElementOverride[] | null;
  sectionBackgrounds: SectionBackgroundOverride[] | null;
}

/** Fetches the admin-saved design (element placement + section backgrounds) for one landing
 * page, keyed by `page`. Public endpoint — these pages are shown to signed-out visitors too.
 *
 * Deliberately does NOT paint the hardcoded defaults while the fetch is in flight: those
 * defaults are almost always stale once an admin has customized the live design, so rendering
 * them first just to swap to the real saved design a moment later produces a visible flash of
 * wrong content on first load. Callers should treat the design as not-yet-ready while `loading`. */
export function useCanvasDesign(
  page: string,
  defaultElements: CanvasElement[],
  mergeElements: (overrides: ElementOverride[] | null | undefined) => CanvasElement[],
  mergeBackgrounds: (overrides: SectionBackgroundOverride[] | null | undefined) => Record<string, string>,
): {
  elements: CanvasElement[];
  sectionBackgrounds: Record<string, string>;
  loading: boolean;
} {
  const [elements, setElements] = useState<CanvasElement[] | null>(null);
  const [sectionBackgrounds, setSectionBackgrounds] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<LandingDesignResponse>(`/api/landing/design?page=${encodeURIComponent(page)}`)
      .then((res) => {
        if (cancelled) return;
        setElements(mergeElements(res.elements));
        setSectionBackgrounds(mergeBackgrounds(res.sectionBackgrounds));
      })
      .catch(() => {
        // Only fall back to the defaults once we know the fetch itself failed.
        if (cancelled) return;
        setElements(defaultElements);
        setSectionBackgrounds(mergeBackgrounds(null));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return {
    elements: elements ?? defaultElements,
    sectionBackgrounds: sectionBackgrounds ?? mergeBackgrounds(null),
    loading,
  };
}
