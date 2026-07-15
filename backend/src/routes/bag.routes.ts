import { createAsyncRouter } from "@/lib/asyncRouter";

import { createBagSchema, updateBagSchema } from "@/validations/bag";
import {
  createBag,
  deleteBag,
  getBagWithItems,
  listBagsWithCounts,
  updateBag,
} from "@/services/bagService";
import { requireAuth } from "@/middleware/auth";
import { BAG_COLOR_PRESETS } from "@/types";

export const bagRouter = createAsyncRouter();

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
    bag: {
      id: String(result.bag._id),
      name: result.bag.name,
      color: result.bag.color ?? BAG_COLOR_PRESETS[0],
    },
    items: result.items,
  });
});

bagRouter.post("/", async (req, res) => {
  const parsed = createBagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await createBag(req.user!._id.toString(), parsed.data.name, parsed.data.color);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({
    bag: { id: String(result.bag._id), name: result.bag.name, color: result.bag.color },
  });
});

bagRouter.patch("/:id", async (req, res) => {
  const parsed = updateBagSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await updateBag(req.user!._id.toString(), parsed.data.id, {
    name: parsed.data.name,
    color: parsed.data.color,
  });
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
