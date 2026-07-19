import { createAsyncRouter } from "@/lib/asyncRouter";
import { z } from "zod";

import { requireAuth } from "@/middleware/auth";
import { getListingById, listListings } from "@/services/listingService";
import { LISTING_TYPES } from "@/types";

export const listingsRouter = createAsyncRouter();

listingsRouter.use(requireAuth);

const listingsQuerySchema = z.object({
  city: z.string().trim().min(1).max(80),
  type: z.enum(LISTING_TYPES).optional(),
  search: z.string().trim().max(100).optional(),
});

listingsRouter.get("/", async (req, res) => {
  const parsed = listingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const listings = await listListings(parsed.data.city, parsed.data.type, parsed.data.search);
  res.json({ listings });
});

listingsRouter.get("/:id", async (req, res) => {
  const listing = await getListingById(req.params.id);
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json({ listing });
});
