import { connectDB } from "@/db";
import { Bag } from "@/models/Bag";
import { ChecklistItem } from "@/models/ChecklistItem";

function normalize(name: string) {
  return name.trim().toLowerCase();
}

/** Bags tab overview: every bag a user has, with packed/total counts of the checklist
 * items currently assigned to it. Bags never store items themselves — only the
 * ChecklistItem.bagId reference is the source of truth. */
export async function listBagsWithCounts(userId: string) {
  await connectDB();

  const [bags, items] = await Promise.all([
    Bag.find({ userId }).sort({ createdAt: 1 }).lean(),
    ChecklistItem.find({ userId, bagId: { $ne: null } }).select("bagId completed").lean(),
  ]);

  return bags.map((bag) => {
    const assigned = items.filter((i) => String(i.bagId) === String(bag._id));
    return {
      id: String(bag._id),
      name: bag.name,
      total: assigned.length,
      completed: assigned.filter((i) => i.completed).length,
    };
  });
}

export async function getBagWithItems(userId: string, id: string) {
  await connectDB();

  const bag = await Bag.findOne({ _id: id, userId }).lean();
  if (!bag) return null;

  const items = await ChecklistItem.find({ userId, bagId: id }).sort({ createdAt: -1 }).lean();
  return { bag, items };
}

export async function createBag(userId: string, name: string) {
  await connectDB();

  const trimmed = name.trim();
  const existing = await Bag.find({ userId }).lean();
  const clash = existing.some((b) => normalize(b.name) === normalize(trimmed));
  if (clash) {
    return { success: false as const, error: "A bag with this name already exists" };
  }

  const bag = await Bag.create({ userId, name: trimmed });
  return { success: true as const, bag };
}

export async function renameBag(userId: string, id: string, name: string) {
  await connectDB();

  const trimmed = name.trim();
  const current = await Bag.findOne({ _id: id, userId }).lean();
  if (!current) {
    return { success: false as const, error: "Bag not found" };
  }

  const existing = await Bag.find({ userId, _id: { $ne: id } }).lean();
  const clash = existing.some((b) => normalize(b.name) === normalize(trimmed));
  if (clash) {
    return { success: false as const, error: "A bag with this name already exists" };
  }

  await Bag.updateOne({ _id: id, userId }, { name: trimmed });
  return { success: true as const };
}

/** Deleting a bag unassigns (never deletes) the checklist items that referenced it. */
export async function deleteBag(userId: string, id: string) {
  await connectDB();

  const bag = await Bag.findOne({ _id: id, userId }).lean();
  if (!bag) {
    return { success: false as const, error: "Bag not found" };
  }

  await ChecklistItem.updateMany({ userId, bagId: id }, { bagId: null });
  await Bag.deleteOne({ _id: id, userId });
  return { success: true as const };
}
