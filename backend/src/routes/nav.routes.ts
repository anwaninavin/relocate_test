import { Router } from "express";

import { getNavLayout } from "@/services/uiLayoutService";
import { requireAuth } from "@/middleware/auth";

export const navRouter = Router();

// No caching — this changes whenever an admin saves the Nav Items editor.
navRouter.get("/layout", requireAuth, async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const widgets = await getNavLayout();
  res.json({ widgets });
});
