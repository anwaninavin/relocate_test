import { connectDB } from "@/db";
import { College } from "@/models/College";
import { CollegeCategory } from "@/models/CollegeCategory";
import { User } from "@/models/User";
import { escapeRegex } from "@/lib/regex";
import { COLLEGE_SEEDS_BY_CATEGORY } from "@/lib/collegeSeedData";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Auto-seeds the curated NIRF-ranked college shortlist (see lib/collegeSeedData) the first
 * time the College collection is empty — mirrors cityService.ensureCitiesSeeded, so the
 * onboarding/profile college picker isn't blocked on someone remembering to run
 * `npm run seed:colleges` by hand after a fresh deploy. No-op once colleges exist (including
 * admin-added ones). Silently skips any category (e.g. "Engineering") that doesn't have a
 * matching CollegeCategory yet — same fallback as the manual script — since that catalog is
 * seeded separately via `npm run seed:checklist-taxonomy`. */
export async function ensureCollegesSeeded() {
  await connectDB();
  const count = await College.estimatedDocumentCount();
  if (count > 0) return;

  const docs: Array<{
    city: string;
    collegeCategoryId: unknown;
    name: string;
    slug: string;
    nirfRank: number | null;
    sortOrder: number;
    active: boolean;
  }> = [];

  for (const [categoryName, colleges] of Object.entries(COLLEGE_SEEDS_BY_CATEGORY)) {
    const category = await CollegeCategory.findOne({ slug: slugify(categoryName) }).lean();
    if (!category) continue;

    for (const college of colleges) {
      docs.push({
        city: college.city.trim(),
        collegeCategoryId: category._id,
        name: college.name.trim(),
        slug: slugify(college.name),
        nirfRank: college.nirfRank ?? null,
        sortOrder: college.sortOrder ?? 0,
        active: true,
      });
    }
  }

  if (docs.length === 0) return;

  await College.insertMany(docs, { ordered: false }).catch((error) => {
    // Duplicate-key races (e.g. multiple instances booting at once) are expected and harmless.
    console.error("College auto-seed encountered an error (may be a harmless race):", error.message ?? error);
  });
}

/** Ranked colleges (a real NIRF rank on file) always sort ahead of unranked ones. Within each
 * of those two groups, ties break on the admin-curated `sortOrder`, then name — most colleges
 * in a city/category shortlist won't have a confidently-known NIRF number, so `sortOrder` is
 * how admins curate a sensible order for them instead of falling back to pure alphabetical. */
function byRankThenName(
  a: { nirfRank?: number | null; sortOrder?: number; name: string },
  b: { nirfRank?: number | null; sortOrder?: number; name: string },
) {
  const rankA = a.nirfRank ?? null;
  const rankB = b.nirfRank ?? null;
  if (rankA !== null && rankB !== null && rankA !== rankB) return rankA - rankB;
  if (rankA !== null && rankB === null) return -1;
  if (rankA === null && rankB !== null) return 1;
  const sortOrderA = a.sortOrder ?? 0;
  const sortOrderB = b.sortOrder ?? 0;
  if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
  return a.name.localeCompare(b.name);
}

/** Public listing — active colleges for a given city + category, best-ranked first, for the
 * onboarding/profile college picker (which cascades off both the city and category selects). */
export async function listActiveCollegesByCityAndCategory(city: string, collegeCategoryId: string) {
  await connectDB();
  const colleges = await College.find({ city, collegeCategoryId, active: true }).lean();
  return colleges.sort(byRankThenName);
}

/** Admin listing — everything, optionally filtered by city, category and/or search. */
export async function listAllColleges(filters: { city?: string; collegeCategoryId?: string; search?: string } = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.city) query.city = filters.city;
  if (filters.collegeCategoryId) query.collegeCategoryId = filters.collegeCategoryId;
  if (filters.search) query.name = { $regex: escapeRegex(filters.search), $options: "i" };
  const colleges = await College.find(query).lean();
  return colleges.sort((a, b) => a.city.localeCompare(b.city) || byRankThenName(a, b));
}

export async function createCollege(input: {
  city: string;
  collegeCategoryId: string;
  name: string;
  nirfRank?: number | null;
  sortOrder?: number;
}) {
  await connectDB();

  const city = input.city.trim();
  const name = input.name.trim();
  const slug = slugify(name);
  const existing = await College.findOne({ city, collegeCategoryId: input.collegeCategoryId, slug }).lean();
  if (existing) {
    return { success: false as const, error: "A college with this name already exists in this city and category" };
  }

  const college = await College.create({
    city,
    collegeCategoryId: input.collegeCategoryId,
    name,
    slug,
    nirfRank: input.nirfRank ?? null,
    sortOrder: input.sortOrder ?? 0,
  });
  return { success: true as const, college };
}

export async function updateCollege(
  id: string,
  input: {
    city?: string;
    collegeCategoryId?: string;
    name?: string;
    nirfRank?: number | null;
    sortOrder?: number;
    active?: boolean;
  },
) {
  await connectDB();

  const current = await College.findById(id).lean();
  if (!current) {
    return { success: false as const, error: "College not found" };
  }

  const patch: Record<string, unknown> = { ...input };
  if (input.city !== undefined) patch.city = input.city.trim();
  if (input.name !== undefined) {
    const name = input.name.trim();
    const slug = slugify(name);
    const city = input.city !== undefined ? input.city.trim() : current.city;
    const categoryId = input.collegeCategoryId ?? current.collegeCategoryId;
    const clash = await College.findOne({ city, collegeCategoryId: categoryId, slug, _id: { $ne: id } }).lean();
    if (clash) {
      return { success: false as const, error: "A college with this name already exists in this city and category" };
    }
    patch.name = name;
    patch.slug = slug;
  }

  const college = await College.findByIdAndUpdate(id, patch, { returnDocument: "after" }).lean();
  return { success: true as const, college };
}

export async function deleteCollege(id: string) {
  await connectDB();

  const college = await College.findById(id).lean();
  if (!college) {
    return { success: false as const, error: "College not found" };
  }

  const userCount = await User.countDocuments({ college: college.name });
  if (userCount > 0) {
    return {
      success: false as const,
      error: "This college is in use by students. Deactivate it instead.",
    };
  }

  await College.deleteOne({ _id: id });
  return { success: true as const };
}
