import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import type { DateRange } from "@/lib/dateRange";

const SLOW_PAGE_THRESHOLD_MS = 1500;

/** Average client-reported page load time (Navigation Timing API, sent as
 * `metadata.loadMs` on page_view — see frontend lib/analytics/client.ts) and which pages
 * cross a "slow" threshold. */
export async function getPageLoadStats(range: DateRange) {
  await connectDB();

  const rows = await AnalyticsEvent.aggregate<{ _id: string; avgLoadMs: number; samples: number }>([
    {
      $match: {
        timestamp: { $gte: range.start, $lte: range.end },
        eventName: "page_view",
        "metadata.loadMs": { $ne: null, $exists: true },
      },
    },
    { $group: { _id: "$page", avgLoadMs: { $avg: "$metadata.loadMs" }, samples: { $sum: 1 } } },
  ]);

  const pages = rows
    .filter((r) => r._id)
    .map((r) => ({ page: r._id, avgLoadMs: Math.round(r.avgLoadMs), samples: r.samples }))
    .sort((a, b) => b.avgLoadMs - a.avgLoadMs);

  return {
    pages,
    slowPages: pages.filter((p) => p.avgLoadMs >= SLOW_PAGE_THRESHOLD_MS),
  };
}

/** Navigation flow: page-to-page transition counts (edges for a flow diagram), the most
 * common short journeys (first 4 pages of a session), and first/last page a visitor is ever
 * seen on within the range. */
export async function getNavigationFlow(range: DateRange) {
  await connectDB();

  const pageViews = await AnalyticsEvent.find({
    timestamp: { $gte: range.start, $lte: range.end },
    eventName: "page_view",
  })
    .select("sessionId page timestamp")
    .sort({ sessionId: 1, timestamp: 1 })
    .lean();

  const sessions = new Map<string, string[]>();
  for (const row of pageViews) {
    if (!row.page) continue;
    const list = sessions.get(row.sessionId) ?? [];
    list.push(row.page);
    sessions.set(row.sessionId, list);
  }

  const transitionCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  let firstPageCounts = new Map<string, number>();
  let lastPageCounts = new Map<string, number>();

  for (const pages of sessions.values()) {
    for (let i = 0; i < pages.length - 1; i++) {
      const key = `${pages[i]} -> ${pages[i + 1]}`;
      transitionCounts.set(key, (transitionCounts.get(key) ?? 0) + 1);
    }
    const shortPath = pages.slice(0, 4).join(" -> ");
    pathCounts.set(shortPath, (pathCounts.get(shortPath) ?? 0) + 1);

    const first = pages[0];
    const last = pages[pages.length - 1];
    firstPageCounts.set(first, (firstPageCounts.get(first) ?? 0) + 1);
    lastPageCounts.set(last, (lastPageCounts.get(last) ?? 0) + 1);
  }

  const toSortedArray = (m: Map<string, number>, limit: number) =>
    [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, limit);

  return {
    transitions: toSortedArray(transitionCounts, 20),
    commonPaths: toSortedArray(pathCounts, 10),
    firstPages: toSortedArray(firstPageCounts, 10),
    lastPages: toSortedArray(lastPageCounts, 10),
  };
}
