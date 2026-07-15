import type { Model, PipelineStage } from "mongoose";

/** Drop-in replacement for `Model.distinct(field, match)`. `.distinct()` returns every matched
 * value in a single BSON document, hard-capped at MongoDB's 16MB document limit — for a
 * high-cardinality field like AnalyticsEvent.visitorId this can exceed that cap and hard-fail
 * once the underlying collection is large enough (a few million distinct ids), rather than
 * just running slowly. `$group` streams through the aggregation pipeline instead of
 * materializing the full list into one document, so it doesn't hit that ceiling. */
export async function distinctValues<T = unknown>(
  model: Model<unknown>,
  field: string,
  match: Record<string, unknown>,
  readPreference?: "secondaryPreferred",
): Promise<T[]> {
  const pipeline: PipelineStage[] = [{ $match: match }, { $group: { _id: `$${field}` } }];
  let query = model.aggregate<{ _id: T }>(pipeline);
  if (readPreference) query = query.read(readPreference);
  const rows = await query;
  return rows.map((row) => row._id);
}
