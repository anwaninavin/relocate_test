import { Types } from "mongoose";

import { connectDB } from "@/db";
import { BudgetEntry } from "@/models/BudgetEntry";
import type { BudgetEntryInput, BudgetEntryUpdateInput } from "@/validations/budget";

export async function listBudgetEntries(userId: string) {
  await connectDB();
  return BudgetEntry.find({ userId }).sort({ date: -1 }).lean();
}

/** Computed via one aggregation instead of pulling every entry into Node and summing with
 * .reduce() — same result, but the database does the summing instead of the API process, and
 * this doesn't grow with the number of entries a (single) account has accumulated. */
export async function getBudgetSummary(userId: string) {
  await connectDB();
  const [result] = await BudgetEntry.aggregate<{
    totals: { _id: string; total: number }[];
    byCategory: { _id: string; total: number }[];
  }>([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $facet: {
        totals: [{ $group: { _id: "$type", total: { $sum: "$amount" } } }],
        byCategory: [
          { $match: { type: "expense" } },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
        ],
      },
    },
  ]);

  const planned = result?.totals.find((t) => t._id === "planned")?.total ?? 0;
  const spent = result?.totals.find((t) => t._id === "expense")?.total ?? 0;
  const byCategory = Object.fromEntries((result?.byCategory ?? []).map((c) => [c._id, c.total]));

  return { planned, spent, remaining: planned - spent, byCategory };
}

export async function createBudgetEntry(userId: string, input: BudgetEntryInput) {
  await connectDB();
  return BudgetEntry.create({ userId, ...input });
}

export async function updateBudgetEntry(userId: string, input: BudgetEntryUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return BudgetEntry.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function deleteBudgetEntry(userId: string, id: string) {
  await connectDB();
  return BudgetEntry.deleteOne({ _id: id, userId });
}
