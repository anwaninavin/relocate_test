import { Types } from "mongoose";

import { connectDB } from "@/db";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { mostFrequent } from "@/lib/stats";

// Bounded across ALL requested items combined (not per item) — a hugely popular item could
// otherwise have millions of referencing rows; this is a statistical hint for "most popular
// cohort", not an exact count, so a fixed-size sample is enough regardless of scale.
const POPULARITY_SAMPLE_SIZE = 5000;

/** Per-item usage analytics shown on the Default Checklist admin page: how many students
 * actually have this item, how many finished it, how many removed it ("skipped" — a
 * soft-deleted UserChecklist row), and which cohort uses it most.
 *
 * usersUsing/completed/skipped are computed with a `$group` in Mongo so a popular item with
 * millions of referencing rows never has to be pulled into Node memory to be counted — only
 * the small per-item summary rows cross the wire. Only the "most popular cohort" hint uses a
 * bounded random sample, since that one genuinely needs to look at individual users. */
export async function getDefaultItemAnalytics(itemIds: string[]) {
  await connectDB();
  if (itemIds.length === 0) return new Map();

  const ids = itemIds.map((id) => new Types.ObjectId(id));

  // Admin-dashboard-only reads — prefer a secondary rather than compete with the operational
  // checklist read/write path for this (potentially very large) query.
  const [counts, sample] = await Promise.all([
    UserChecklist.aggregate<{ _id: Types.ObjectId; usersUsing: number; completed: number; skipped: number }>([
      { $match: { defaultChecklistItemId: { $in: ids } } },
      {
        $group: {
          _id: "$defaultChecklistItemId",
          usersUsing: { $sum: { $cond: ["$deleted", 0, 1] } },
          completed: { $sum: { $cond: [{ $and: [{ $eq: ["$deleted", false] }, "$checked"] }, 1, 0] } },
          skipped: { $sum: { $cond: ["$deleted", 1, 0] } },
        },
      },
    ])
      .allowDiskUse(true)
      .read("secondaryPreferred"),
    UserChecklist.aggregate<{ defaultChecklistItemId: Types.ObjectId; userId: Types.ObjectId }>([
      { $match: { defaultChecklistItemId: { $in: ids }, deleted: false } },
      { $sample: { size: POPULARITY_SAMPLE_SIZE } },
      { $project: { defaultChecklistItemId: 1, userId: 1 } },
    ])
      .allowDiskUse(true)
      .read("secondaryPreferred"),
  ]);

  const userIds = Array.from(new Set(sample.map((r) => String(r.userId))));
  const [users, categories, courses] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("collegeCategoryId courseId").lean(),
    CollegeCategory.find().select("name").lean(),
    Course.find().select("name").lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const categoryNameById = new Map(categories.map((c) => [String(c._id), c.name]));
  const courseNameById = new Map(courses.map((c) => [String(c._id), c.name]));

  const sampleByItem = new Map<string, typeof sample>();
  for (const row of sample) {
    const key = String(row.defaultChecklistItemId);
    const group = sampleByItem.get(key) ?? [];
    group.push(row);
    sampleByItem.set(key, group);
  }
  const countsById = new Map(counts.map((c) => [String(c._id), c]));

  const result = new Map<
    string,
    {
      usersUsing: number;
      completed: number;
      skipped: number;
      completionRate: number;
      popularityScore: number;
      mostPopularCollegeCategory: string | null;
      mostPopularCourse: string | null;
    }
  >();

  for (const id of itemIds) {
    const c = countsById.get(id) ?? { usersUsing: 0, completed: 0, skipped: 0 };
    const sampleRows = sampleByItem.get(id) ?? [];
    const collegeCategoryIds = sampleRows.map((r) => userById.get(String(r.userId))?.collegeCategoryId).filter(Boolean).map(String);
    const courseIds = sampleRows.map((r) => userById.get(String(r.userId))?.courseId).filter(Boolean).map(String);
    const popularCategoryId = mostFrequent(collegeCategoryIds);
    const popularCourseId = mostFrequent(courseIds);

    result.set(id, {
      usersUsing: c.usersUsing,
      completed: c.completed,
      skipped: c.skipped,
      completionRate: c.usersUsing === 0 ? 0 : Math.round((c.completed / c.usersUsing) * 100),
      popularityScore: c.usersUsing + c.skipped,
      mostPopularCollegeCategory: popularCategoryId ? (categoryNameById.get(popularCategoryId) ?? null) : null,
      mostPopularCourse: popularCourseId ? (courseNameById.get(popularCourseId) ?? null) : null,
    });
  }

  return result;
}

export async function getChecklistDashboardStats() {
  await connectDB();

  const [
    totalCategories,
    totalCourses,
    totalDefaultItems,
    activeDefaultItems,
    totalRows,
    checkedRows,
    recentlyAdded,
    recentlyUpdated,
  ] = await Promise.all([
    CollegeCategory.countDocuments(),
    Course.countDocuments(),
    DefaultChecklistItem.countDocuments(),
    DefaultChecklistItem.countDocuments({ active: true }),
    UserChecklist.countDocuments({ deleted: false, defaultChecklistItemId: { $ne: null } }).read("secondaryPreferred"),
    UserChecklist.countDocuments({ deleted: false, defaultChecklistItemId: { $ne: null }, checked: true }).read(
      "secondaryPreferred",
    ),
    DefaultChecklistItem.find().sort({ createdAt: -1 }).limit(5).select("title category createdAt").lean(),
    DefaultChecklistItem.find().sort({ updatedAt: -1 }).limit(5).select("title category updatedAt").lean(),
  ]);

  return {
    totalCategories,
    totalCourses,
    totalDefaultItems,
    activeDefaultItems,
    completionRate: totalRows === 0 ? 0 : Math.round((checkedRows / totalRows) * 100),
    recentlyAdded,
    recentlyUpdated,
  };
}
