import type { Types } from "mongoose";

import { connectDB } from "@/db";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { User } from "@/models/User";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { normalizeItemName } from "@/lib/textSimilarity";
import { mostFrequent } from "@/lib/stats";
import { createDefaultChecklistItem, type DefaultChecklistItemInput } from "@/services/defaultChecklistItemService";
import type { ChecklistPriority } from "@/types";

export interface SuggestedItem {
  key: string;
  name: string;
  category: string;
  usersUsing: number;
  completionPercent: number;
  mostPopularCollegeCategory: string | null;
  mostPopularCourse: string | null;
  firstAdded: string;
  lastUsed: string;
}

/** Rows written before `customNameNormalized` existed on the schema won't have it set — fix
 * those up once so they participate in grouping/lookup below. Self-healing: every write path
 * sets the field going forward, so this only ever touches pre-existing legacy rows. */
async function backfillMissingNormalizedNames() {
  const rows = await UserChecklist.find({ isCustomItem: true, customNameNormalized: null, customName: { $ne: null } })
    .select("customName")
    .lean();
  if (rows.length === 0) return;

  await UserChecklist.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { customNameNormalized: normalizeItemName(row.customName ?? "") } },
      },
    })),
    { ordered: false },
  );
}

const POPULARITY_SAMPLE_SIZE = 300;

/** User-created checklist items that aren't already in the master catalog (case-insensitive
 * title match), grouped and ranked by how many students independently added the same thing —
 * the admin's queue of "items worth promoting to the default checklist".
 *
 * Grouping/counting happens in Mongo (indexed by isCustomItem+deleted, keyed by the stored
 * customNameNormalized) instead of pulling every custom row into Node, so this stays cheap as
 * the checklist collection grows well past what fits comfortably in application memory. Only
 * the "most popular cohort" hint uses a bounded sample — usersUsing/completion% are exact. */
export async function listSuggestedItems(): Promise<SuggestedItem[]> {
  await connectDB();
  await backfillMissingNormalizedNames();

  const masterItems = await DefaultChecklistItem.find().select("title").lean();
  const masterNames = new Set(masterItems.map((m) => normalizeItemName(m.title)));

  const baseMatch = { isCustomItem: true, deleted: false, customNameNormalized: { $ne: null } };

  const [stats, topNames, topCategories] = await Promise.all([
    UserChecklist.aggregate<{
      _id: string;
      userIds: Types.ObjectId[];
      checkedCount: number;
      totalCount: number;
      firstAdded: Date;
      lastUsed: Date;
    }>([
      { $match: baseMatch },
      {
        $group: {
          _id: "$customNameNormalized",
          userIds: { $addToSet: "$userId" },
          checkedCount: { $sum: { $cond: ["$checked", 1, 0] } },
          totalCount: { $sum: 1 },
          firstAdded: { $min: "$createdAt" },
          lastUsed: { $max: "$updatedAt" },
        },
      },
    ]).allowDiskUse(true),
    // "Most common spelling" per key — near-duplicate names (typos/pluralization) normalize
    // to the same key, so pick whichever exact spelling was used most often.
    UserChecklist.aggregate<{ _id: string; name: string }>([
      { $match: baseMatch },
      { $group: { _id: { key: "$customNameNormalized", name: "$customName" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $group: { _id: "$_id.key", name: { $first: "$_id.name" } } },
    ]).allowDiskUse(true),
    UserChecklist.aggregate<{ _id: string; category: string }>([
      { $match: baseMatch },
      { $group: { _id: { key: "$customNameNormalized", category: "$customCategory" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $group: { _id: "$_id.key", category: { $first: "$_id.category" } } },
    ]).allowDiskUse(true),
  ]);

  const nameByKey = new Map(topNames.map((r) => [r._id, r.name]));
  const categoryByKey = new Map(topCategories.map((r) => [r._id, r.category]));

  const candidates = stats.filter((s) => s._id && !masterNames.has(s._id));
  if (candidates.length === 0) return [];

  const sampleUserIds = new Set<string>();
  for (const s of candidates) {
    for (const id of s.userIds.slice(0, POPULARITY_SAMPLE_SIZE)) sampleUserIds.add(String(id));
  }

  const [users, categories, courses] = await Promise.all([
    User.find({ _id: { $in: Array.from(sampleUserIds) } }).select("collegeCategoryId courseId").lean(),
    CollegeCategory.find().select("name").lean(),
    Course.find().select("name").lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const categoryNameById = new Map(categories.map((c) => [String(c._id), c.name]));
  const courseNameById = new Map(courses.map((c) => [String(c._id), c.name]));

  return candidates
    .map((s) => {
      const sampleIds = s.userIds.slice(0, POPULARITY_SAMPLE_SIZE).map(String);
      const collegeCategoryIds = sampleIds.map((id) => userById.get(id)?.collegeCategoryId).filter(Boolean).map(String);
      const courseIds = sampleIds.map((id) => userById.get(id)?.courseId).filter(Boolean).map(String);
      const popularCategoryId = mostFrequent(collegeCategoryIds);
      const popularCourseId = mostFrequent(courseIds);

      return {
        key: s._id,
        name: nameByKey.get(s._id) ?? s._id,
        category: categoryByKey.get(s._id) ?? "Miscellaneous",
        usersUsing: s.userIds.length,
        completionPercent: s.totalCount === 0 ? 0 : Math.round((s.checkedCount / s.totalCount) * 100),
        mostPopularCollegeCategory: popularCategoryId ? (categoryNameById.get(popularCategoryId) ?? null) : null,
        mostPopularCourse: popularCourseId ? (courseNameById.get(popularCourseId) ?? null) : null,
        firstAdded: new Date(s.firstAdded).toISOString(),
        lastUsed: new Date(s.lastUsed).toISOString(),
      };
    })
    .sort((a, b) => b.usersUsing - a.usersUsing);
}

export interface SuggestedItemUser {
  userId: string;
  name: string | null;
  mobile: string;
  collegeCategory: string | null;
  course: string | null;
  checked: boolean;
  addedAt: string;
}

/** Which specific students added a given suggested item — the drill-down behind the
 * anonymized `usersUsing` count above, so an admin can see the actual cohort (and reach one of
 * them) before deciding to promote it. Looked up by the indexed customNameNormalized field. */
export async function getSuggestedItemUsers(key: string): Promise<SuggestedItemUser[]> {
  await connectDB();

  const rows = await UserChecklist.find({ isCustomItem: true, deleted: false, customNameNormalized: key })
    .select("userId checked createdAt")
    .sort({ createdAt: -1 })
    .lean();
  if (rows.length === 0) return [];

  const userIds = Array.from(new Set(rows.map((r) => String(r.userId))));
  const [users, categories, courses] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("name mobile collegeCategoryId courseId").lean(),
    CollegeCategory.find().select("name").lean(),
    Course.find().select("name").lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const categoryNameById = new Map(categories.map((c) => [String(c._id), c.name]));
  const courseNameById = new Map(courses.map((c) => [String(c._id), c.name]));

  return rows.map((row) => {
    const user = userById.get(String(row.userId));
    return {
      userId: String(row.userId),
      name: user?.name ?? null,
      mobile: user?.mobile ?? "",
      collegeCategory: user?.collegeCategoryId ? (categoryNameById.get(String(user.collegeCategoryId)) ?? null) : null,
      course: user?.courseId ? (courseNameById.get(String(user.courseId)) ?? null) : null,
      checked: Boolean(row.checked),
      addedAt: new Date(row.createdAt as unknown as string).toISOString(),
    };
  });
}

/** After promoting a suggestion to the master catalog, every student's existing custom row for
 * that same item is converted into a master-linked row (checked/quantity/note/bag preserved) —
 * instead of leaving their original entry as a disconnected duplicate forever. One conversion
 * per user: if a user somehow has more than one matching custom row (e.g. via the "duplicate"
 * quick-action), only the first is promoted, since a user can only have one row per master
 * item (unique userId+defaultChecklistItemId index) — the rest are left as-is. */
async function convertCustomItemsToMaster(customNameNormalized: string, defaultChecklistItemId: Types.ObjectId) {
  await connectDB();

  const rows = await UserChecklist.find({ isCustomItem: true, deleted: false, customNameNormalized })
    .select("userId")
    .lean();
  if (rows.length === 0) return 0;

  const seenUsers = new Set<string>();
  const ops = [];
  for (const row of rows) {
    const userId = String(row.userId);
    if (seenUsers.has(userId)) continue;
    seenUsers.add(userId);
    ops.push({
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: {
            defaultChecklistItemId,
            isCustomItem: false,
            customName: null,
            customCategory: null,
            customNameNormalized: null,
          },
        },
      },
    });
  }

  if (ops.length === 0) return 0;
  const result = await UserChecklist.bulkWrite(ops, { ordered: false });
  return result.modifiedCount ?? 0;
}

export async function addSuggestedItemToDefault(
  input: {
    name: string;
    category: string;
    description?: string;
    priority?: ChecklistPriority;
    applicableCollegeCategories?: string[];
    applicableCourses?: string[];
    isForAllCollegeCategories?: boolean;
    isForAllCourses?: boolean;
  },
  adminUserId: string,
) {
  const payload: DefaultChecklistItemInput = {
    category: input.category,
    title: input.name,
    description: input.description ?? "",
    priority: input.priority ?? "medium",
    applicableCollegeCategories: input.applicableCollegeCategories ?? [],
    applicableCourses: input.applicableCourses ?? [],
    isForAllCollegeCategories: input.isForAllCollegeCategories ?? true,
    isForAllCourses: input.isForAllCourses ?? true,
  };
  const result = await createDefaultChecklistItem(payload, adminUserId);
  if (!result.success) return result;

  const convertedCount = await convertCustomItemsToMaster(normalizeItemName(input.name), result.item._id);
  return { ...result, convertedCount };
}
