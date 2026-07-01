import type { Model, QueryFilter } from "mongoose";

interface RateLimitOptions<T> {
  model: Model<T>;
  filter: QueryFilter<T>;
  windowMs: number;
  max: number;
}

/** DB-backed rate limit check (serverless-safe, no shared in-memory state required). */
export async function checkRateLimit<T>({
  model,
  filter,
  windowMs,
  max,
}: RateLimitOptions<T>) {
  const since = new Date(Date.now() - windowMs);
  const count = await model.countDocuments({
    ...filter,
    createdAt: { $gte: since },
  } as QueryFilter<T>);

  return {
    allowed: count < max,
    remaining: Math.max(0, max - count),
  };
}
