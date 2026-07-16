import { createAsyncRouter } from "@/lib/asyncRouter";

import { getHomeLayout } from "@/services/uiLayoutService";
import { requireAuth } from "@/middleware/auth";

export const homeRouter = createAsyncRouter();

// No caching — this changes whenever an admin saves the Home Cards editor.
homeRouter.get("/layout", requireAuth, async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const widgets = await getHomeLayout();
  res.json({ widgets });
});
