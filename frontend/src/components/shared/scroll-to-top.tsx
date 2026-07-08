import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Plain BrowserRouter doesn't reset scroll position on navigation — without this, moving
 * to a new page while scrolled down elsewhere (e.g. clicking "Hostel Guide" from mid-scroll
 * on another page) keeps the old scroll offset, so the new page can open already scrolled
 * past its own header/nav. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
