import { createAsyncRouter } from "@/lib/asyncRouter";

import { globalSearch } from "@/services/searchService";
import { requireAuth } from "@/middleware/auth";

export const searchRouter = createAsyncRouter();

searchRouter.get("/", requireAuth, async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const results = await globalSearch(req.user!._id.toString(), query);
  res.json({ results });
});
