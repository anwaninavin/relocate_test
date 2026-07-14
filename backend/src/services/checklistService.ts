import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { Bag } from "@/models/Bag";
import { User } from "@/models/User";
import { UserChecklist } from "@/models/UserChecklist";
import { activeDefaultItemsForUser } from "@/services/checklistMasterService";
import type { ChecklistCategory, ChecklistPriority } from "@/types";
import type { ChecklistItemInput, ChecklistItemUpdateInput } from "@/validations/checklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";
import { areNearDuplicateNames } from "@/lib/textSimilarity";
import { listCategories } from "@/services/categoryService";


function fromUserChecklist(doc: any, master?: any, bag?: any) {
  const isCustom = doc.isCustomItem || !master;
  return {
    _id: doc._id,
    userId: doc.userId,
    category: isCustom ? doc.customCategory : master.category,
    item: isCustom ? doc.customName : master.title,
    description: isCustom ? "" : master.description,
    imageUrl: isCustom ? null : master.image,
    bagId: doc.bagId,
    notes: doc.note ?? "",
    completed: doc.checked,
    priority: isCustom ? "medium" : master.priority,
    price: isCustom ? null : master.estimatedPrice,
    recommendedBrand: isCustom ? null : master.recommendedBrand,
    recommendedStore: isCustom ? null : master.recommendedStore,
    purchaseLink: isCustom ? null : master.purchaseLink,
    importance: isCustom ? "" : master.importance,
    bagName: bag?.name ?? null,
    bagColor: bag?.color ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function hasNewChecklist(userId: string) {
  return (await UserChecklist.countDocuments({ userId })) > 0;
}

// "Fashion Design Tools" is only relevant to Designing students — see categoryService.
const DESIGN_ONLY_CATEGORY = "Fashion Design Tools";

async function getTemplateForUser(userId: string) {
  const user = await User.findById(userId).select("collegeCategory").lean();
  if (user?.collegeCategory === "Designing") {
    return DEFAULT_CHECKLIST_TEMPLATE;
  }
  return DEFAULT_CHECKLIST_TEMPLATE.filter((item) => item.category !== DESIGN_ONLY_CATEGORY);
}

export async function getCategorySummaries(userId: string) {
  await connectDB();
  const [categories, items] = await Promise.all([
    listCategories(userId),
    ChecklistItem.find({ userId }).select("category completed").lean(),
  ]);

  return categories.map(({ name: category }) => {
    const inCategory = items.filter((i) => i.category === category);
    const completed = inCategory.filter((i) => i.completed).length;
    return {
      category,
      total: inCategory.length,
      completed,
    };
  });
}

export async function getOverallProgress(userId: string) {
  await connectDB();
  const [total, completed] = await Promise.all([
    ChecklistItem.countDocuments({ userId }),
    ChecklistItem.countDocuments({ userId, completed: true }),
  ]);
  return { total, completed };
}

export async function listItemsByCategory(userId: string, category: ChecklistCategory) {
  await connectDB();
  return ChecklistItem.find({ userId, category }).sort({ createdAt: -1 }).lean();
}

/** All items for a user, grouped by category — for the expandable accordion overview.
 * Attaches `bagName`/`bagColor` alongside each item's `bagId` for display purposes only
 * (e.g. so the checklist row can render the assigned bag's color without a second
 * round-trip); the bag assignment itself still lives solely on the checklist item. */
export async function getAllItemsByCategory(userId: string) {
  await connectDB();

  if (!(await hasNewChecklist(userId))) {
    const [categories, items, bags] = await Promise.all([
      listCategories(userId),
      ChecklistItem.find({ userId }).sort({ createdAt: -1 }).lean(),
      Bag.find({ userId }).select("name color").lean(),
    ]);

    const bagById = new Map(bags.map((b) => [String(b._id), b]));
    const itemsWithBagInfo = items.map((item) => {
      const bag = item.bagId ? bagById.get(String(item.bagId)) : undefined;
      return { ...item, bagName: bag?.name ?? null, bagColor: bag?.color ?? null };
    });

    return categories.map(({ name: category }) => ({
      category,
      items: itemsWithBagInfo.filter((i) => i.category === category),
    }));
  }

  const [rows, bags] = await Promise.all([
    UserChecklist.find({ userId, deleted: false }).populate("defaultChecklistItemId").sort({ customOrder: 1, createdAt: -1 }).lean(),
    Bag.find({ userId }).select("name color").lean(),
  ]);
  const bagById = new Map(bags.map((b) => [String(b._id), b]));
  const items = rows.map((row: any) => fromUserChecklist(row, row.defaultChecklistItemId, row.bagId ? bagById.get(String(row.bagId)) : undefined));
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  return categories.map((category) => ({ category, items: items.filter((i) => i.category === category) }));
}

/** Idempotent: only seeds the starter checklist if the user has no items yet. Excludes
 * "Fashion Design Tools" items unless the user's college category is Designing. */
export async function seedDefaultChecklistIfEmpty(userId: string) {
  await connectDB();

  const [existingNewCount, existingLegacyCount, user] = await Promise.all([
    UserChecklist.countDocuments({ userId }),
    ChecklistItem.countDocuments({ userId }),
    User.findById(userId).lean(),
  ]);
  if (existingNewCount > 0 || existingLegacyCount > 0 || !user) {
    return { seeded: false, count: 0 };
  }

  const templateItems = await activeDefaultItemsForUser(user);
  const docs = templateItems.map((item: any) => ({
    userId,
    defaultChecklistItemId: item._id,
    checked: false,
    quantity: 1,
    note: "",
    metadataVersion: item.__v ?? 1,
    deleted: false,
  }));
  if (docs.length > 0) await UserChecklist.insertMany(docs, { ordered: false });

  return { seeded: true, count: docs.length };
}

/** Adds any starter-template items the user doesn't already have (by category + item name). */
export async function addMissingTemplateItems(userId: string) {
  await connectDB();

  const template = await getTemplateForUser(userId);

  const existing = await ChecklistItem.find({ userId }).select("category item").lean();
  const existingKeys = new Set(
    existing.map((i) => `${i.category}::${i.item.trim().toLowerCase()}`),
  );

  const missing = template.filter(
    (template) => !existingKeys.has(`${template.category}::${template.item.trim().toLowerCase()}`),
  );

  if (missing.length === 0) {
    return { count: 0 };
  }

  await ChecklistItem.insertMany(missing.map((template) => ({ userId, ...template })));
  return { count: missing.length };
}

export async function createChecklistItem(userId: string, input: ChecklistItemInput) {
  await connectDB();
  if (await hasNewChecklist(userId)) {
    return UserChecklist.create({ userId, defaultChecklistItemId: null, isCustomItem: true, customName: input.item, customCategory: input.category, checked: false, quantity: 1, note: input.notes ?? "", bagId: input.bagId ?? null });
  }
  return ChecklistItem.create({ userId, ...input });
}

/** Adds several items to one category in a single insert, skipping names already present. */
export async function createChecklistItems(
  userId: string,
  category: ChecklistCategory,
  names: string[],
  priority: ChecklistPriority,
) {
  await connectDB();

  const existing = await ChecklistItem.find({ userId, category }).select("item").lean();
  const existingNames = existing.map((i) => i.item);

  const seen: string[] = [];
  const docs: { userId: string; category: ChecklistCategory; item: string; priority: ChecklistPriority }[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const isDuplicate = [...existingNames, ...seen].some((other) =>
      areNearDuplicateNames(name, other),
    );
    if (isDuplicate) continue;
    seen.push(name);
    docs.push({ userId, category, item: name, priority });
  }

  if (docs.length === 0) {
    return { count: 0, skipped: names.length };
  }

  await ChecklistItem.insertMany(docs);
  return { count: docs.length, skipped: names.length - docs.length };
}

export async function updateChecklistItem(userId: string, input: ChecklistItemUpdateInput) {
  await connectDB();
  const { id, completed, notes, item, category, bagId, ...rest } = input;
  if (await hasNewChecklist(userId)) {
    return UserChecklist.findOneAndUpdate({ _id: id, userId }, { ...(completed !== undefined ? { checked: completed } : {}), ...(notes !== undefined ? { note: notes } : {}), ...(item !== undefined ? { customName: item, isCustomItem: true } : {}), ...(category !== undefined ? { customCategory: category, isCustomItem: true } : {}), ...(bagId !== undefined ? { bagId } : {}) }, { returnDocument: "after" }).lean();
  }
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, { completed, notes, item, category, bagId, ...rest }, { returnDocument: "after" }).lean();
}

export async function renameChecklistItem(userId: string, id: string, item: string) {
  await connectDB();
  if (await hasNewChecklist(userId)) return UserChecklist.findOneAndUpdate({ _id: id, userId }, { customName: item, isCustomItem: true }, { returnDocument: "after" }).lean();
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, { item }, { returnDocument: "after" }).lean();
}

/** Finds near-duplicate items within each category and merges each group into the oldest item. */
export async function mergeDuplicateItems(userId: string) {
  await connectDB();

  const items = await ChecklistItem.find({ userId }).sort({ createdAt: 1 }).lean();
  const idsToDelete: string[] = [];
  const idsToComplete: string[] = [];
  const categoriesInUse = new Set(items.map((i) => i.category));

  for (const category of categoriesInUse) {
    const inCategory = items.filter((i) => i.category === category);
    const grouped: (typeof inCategory)[number][][] = [];

    for (const current of inCategory) {
      const group = grouped.find((g) => areNearDuplicateNames(g[0].item, current.item));
      if (group) {
        group.push(current);
      } else {
        grouped.push([current]);
      }
    }

    for (const group of grouped) {
      if (group.length < 2) continue;
      const [keep, ...rest] = group;
      idsToDelete.push(...rest.map((r) => String(r._id)));
      if (group.some((g) => g.completed) && !keep.completed) {
        idsToComplete.push(String(keep._id));
      }
    }
  }

  if (idsToDelete.length > 0) {
    await ChecklistItem.deleteMany({ _id: { $in: idsToDelete }, userId });
  }
  if (idsToComplete.length > 0) {
    await ChecklistItem.updateMany({ _id: { $in: idsToComplete }, userId }, { completed: true });
  }

  return { mergedCount: idsToDelete.length };
}

export async function deleteChecklistItem(userId: string, id: string) {
  await connectDB();
  if (await hasNewChecklist(userId)) return UserChecklist.findOneAndUpdate({ _id: id, userId }, { deleted: true }, { returnDocument: "after" }).lean();
  return ChecklistItem.deleteOne({ _id: id, userId });
}

export async function bulkUpdateItems(
  userId: string,
  ids: string[],
  action: "complete" | "incomplete" | "delete" | "duplicate",
) {
  await connectDB();

  if (action === "delete") {
    return ChecklistItem.deleteMany({ _id: { $in: ids }, userId });
  }

  if (action === "complete" || action === "incomplete") {
    return ChecklistItem.updateMany(
      { _id: { $in: ids }, userId },
      { completed: action === "complete" },
    );
  }

  if (action === "duplicate") {
    const items = await ChecklistItem.find({ _id: { $in: ids }, userId }).lean();
    const copies = items.map((doc) => ({
      userId: doc.userId,
      category: doc.category,
      item: doc.item,
      description: doc.description,
      imageUrl: doc.imageUrl,
      bagId: doc.bagId,
      notes: doc.notes,
      priority: doc.priority,
      price: doc.price,
      priceRangeMin: doc.priceRangeMin,
      priceRangeMax: doc.priceRangeMax,
      recommendedBrand: doc.recommendedBrand,
      recommendedStore: doc.recommendedStore,
      purchaseLink: doc.purchaseLink,
      studentRating: doc.studentRating,
      importance: doc.importance,
      completed: false,
    }));
    if (copies.length > 0) {
      await ChecklistItem.insertMany(copies);
    }
    return { insertedCount: copies.length };
  }
}
