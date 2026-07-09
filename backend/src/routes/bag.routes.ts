import { Router } from "express";

import { createBagSchema, renameBagSchema } from "@/validations/bag";
import {
  createBag,
  deleteBag,
  getBagWithItems,
  listBagsWithCounts,
  renameBag,
} from "@/services/bagService";
import { requireAuth } from "@/middleware/auth";

export const bagRouter = Router();

bagRouter.use(requireAuth);

bagRouter.get("/", async (req, res) => {
  const bags = await listBagsWithCounts(req.user!._id.toString());
  res.json({ bags });
});

bagRouter.get("/:id", async (req, res) => {
  const result = await getBagWithItems(req.user!._id.toString(), req.params.id);
  if (!result) {
    res.status(404).json({ error: "Bag not found" });
    return;
  }
  res.json({
    bag: { id: String(result.bag._id), name: result.bag.name },
    items: result.items,
  });
});

bagRouter.post("/", async (req, res) => {
  const parsed = createBagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await createBag(req.user!._id.toString(), parsed.data.name);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ bag: { id: String(result.bag._id), name: result.bag.name } });
});

bagRouter.patch("/:id", async (req, res) => {
  const parsed = renameBagSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await renameBag(req.user!._id.toString(), parsed.data.id, parsed.data.name);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

bagRouter.delete("/:id", async (req, res) => {
  const result = await deleteBag(req.user!._id.toString(), req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});
