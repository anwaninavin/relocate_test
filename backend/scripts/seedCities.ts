/**
 * Loads the City catalog (the registration/profile city picker) from a fixed list of 200+
 * major Indian cities. Idempotent — upserts by name, safe to re-run.
 *
 * The backend also auto-seeds this list on startup if the collection is empty (see
 * cityService.ensureCitiesSeeded), so this script is only needed for manually re-syncing an
 * existing deployment or backfilling an already-populated collection.
 *
 * Usage: npm run seed:cities
 */
import "dotenv/config";
import mongoose from "mongoose";

import { City } from "@/models/City";
import { INDIAN_CITY_NAMES } from "@/lib/indianCities";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  let created = 0;
  let skipped = 0;
  for (const name of INDIAN_CITY_NAMES) {
    const result = await City.findOneAndUpdate(
      { name },
      { $setOnInsert: { name } },
      { upsert: true, new: false },
    );
    if (result) {
      skipped += 1;
    } else {
      created += 1;
    }
  }

  console.log(`Cities seeded: ${created} created, ${skipped} already present (${INDIAN_CITY_NAMES.length} total).`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed cities:", error);
  process.exit(1);
});
