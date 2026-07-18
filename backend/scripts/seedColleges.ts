/**
 * Seeds a starter shortlist of real colleges per (city, college category) into the College
 * catalog, so the onboarding/profile college picker isn't empty on a fresh deploy. Idempotent —
 * upserts by (city, category, slug), safe to re-run.
 *
 * The same curated list also backs collegeService.ensureCollegesSeeded, which runs this
 * automatically at server startup (see src/lib/collegeSeedData.ts) — this script exists for
 * manually re-running it (e.g. to pick up new curated entries against an already-seeded DB,
 * which the startup auto-seed skips once the collection is non-empty).
 *
 * Usage: npm run seed:colleges
 */
import "dotenv/config";
import mongoose from "mongoose";

import { College } from "@/models/College";
import { CollegeCategory } from "@/models/CollegeCategory";
import { COLLEGE_SEEDS_BY_CATEGORY } from "@/lib/collegeSeedData";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  let created = 0;
  let skipped = 0;

  for (const [categoryName, colleges] of Object.entries(COLLEGE_SEEDS_BY_CATEGORY)) {
    const category = await CollegeCategory.findOne({ slug: slugify(categoryName) }).lean();
    if (!category) {
      console.warn(`  Skipping "${categoryName}" — no matching CollegeCategory found. Run seed:checklist-taxonomy first.`);
      continue;
    }

    for (const college of colleges) {
      const city = college.city.trim();
      const name = college.name.trim();
      const slug = slugify(name);
      const result = await College.findOneAndUpdate(
        { city, collegeCategoryId: category._id, slug },
        {
          $setOnInsert: {
            city,
            collegeCategoryId: category._id,
            name,
            slug,
            nirfRank: college.nirfRank ?? null,
            sortOrder: college.sortOrder ?? 0,
            active: true,
          },
        },
        { upsert: true, new: false },
      );
      if (result) {
        skipped += 1;
      } else {
        created += 1;
        console.log(`  + ${city} / ${categoryName}: ${name}`);
      }
    }
  }

  console.log(`Colleges seeded: ${created} created, ${skipped} already present.`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed colleges:", error);
  process.exit(1);
});
