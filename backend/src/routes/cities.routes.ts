import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { listCities } from "@/services/cityService";

export const citiesRouter = Router();

citiesRouter.use(requireAuth);

citiesRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  res.json({ cities: await listCities(search) });
});
