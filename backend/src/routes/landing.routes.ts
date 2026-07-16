import { createAsyncRouter } from "@/lib/asyncRouter";

import { getLandingDesign, LANDING_PAGES, type LandingPage } from "@/services/landingDesignService";

export const landingRouter = createAsyncRouter();

function parsePage(value: unknown): LandingPage {
  return LANDING_PAGES.includes(value as LandingPage) ? (value as LandingPage) : "home";
}

// Public — both the home screen and the survival guide are shown to signed-out visitors, so
// this must not require auth. No caching: this changes whenever an admin saves the relevant
// screen editor, and a stale cached copy (browser or intermediary) would make just-saved
// edits look like they never took effect.
landingRouter.get("/design", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const design = await getLandingDesign(parsePage(req.query.page));
  res.json(design);
});
