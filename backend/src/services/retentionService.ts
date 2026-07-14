import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { daysAgo, startOfDay } from "@/lib/dateRange";

const LOOKBACK_DAYS = 90; // wide enough to observe 30-day retention with room to spare
const RETENTION_WINDOWS = [1, 7, 15, 30] as const;
const COHORT_WEEKS = 8;

interface VisitorDays {
  _id: string;
  days: string[];
}

/** Retention is inherently a rolling-window metric (it needs enough elapsed time to observe
 * "came back N days later"), so unlike the rest of the dashboard it ignores the dashboard's
 * date-range filter and always looks back a fixed 90 days from now. */
export async function getRetentionAnalytics() {
  await connectDB();
  const since = daysAgo(LOOKBACK_DAYS);

  const rows = await AnalyticsEvent.aggregate<VisitorDays>([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: "$visitorId",
        days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } } },
      },
    },
  ]);

  const today = startOfDay(new Date());
  const dayMs = 24 * 60 * 60 * 1000;

  const retention: Record<number, { eligible: number; retained: number }> = {};
  for (const n of RETENTION_WINDOWS) retention[n] = { eligible: 0, retained: 0 };

  let returningUsers = 0;
  const cohortBuckets = new Map<string, { visitors: Set<string>; activeByWeek: Map<number, Set<string>> }>();

  for (const row of rows) {
    const activeDaySet = new Set(row.days);
    if (activeDaySet.size > 1) returningUsers += 1;

    const sortedDays = [...activeDaySet].sort();
    const firstDay = new Date(sortedDays[0] + "T00:00:00.000Z");

    for (const n of RETENTION_WINDOWS) {
      const targetDate = new Date(firstDay.getTime() + n * dayMs);
      if (targetDate > today) continue; // not enough elapsed time yet to know either way
      retention[n].eligible += 1;
      const targetKey = targetDate.toISOString().slice(0, 10);
      if (activeDaySet.has(targetKey)) retention[n].retained += 1;
    }

    // Cohort grid: bucket by the ISO week the visitor was first seen, then for each
    // subsequent week (0..COHORT_WEEKS-1) mark whether they had any activity in it.
    const cohortWeekStart = new Date(firstDay);
    cohortWeekStart.setUTCDate(cohortWeekStart.getUTCDate() - cohortWeekStart.getUTCDay());
    const cohortKey = cohortWeekStart.toISOString().slice(0, 10);

    const bucket = cohortBuckets.get(cohortKey) ?? { visitors: new Set(), activeByWeek: new Map() };
    bucket.visitors.add(row._id);

    for (const dayStr of activeDaySet) {
      const day = new Date(dayStr + "T00:00:00.000Z");
      const weekIndex = Math.floor((day.getTime() - cohortWeekStart.getTime()) / (7 * dayMs));
      if (weekIndex < 0 || weekIndex >= COHORT_WEEKS) continue;
      const weekSet = bucket.activeByWeek.get(weekIndex) ?? new Set();
      weekSet.add(row._id);
      bucket.activeByWeek.set(weekIndex, weekSet);
    }
    cohortBuckets.set(cohortKey, bucket);
  }

  const retentionSummary = RETENTION_WINDOWS.map((n) => ({
    windowDays: n,
    eligibleVisitors: retention[n].eligible,
    retainedVisitors: retention[n].retained,
    retentionRate: retention[n].eligible === 0 ? 0 : Math.round((retention[n].retained / retention[n].eligible) * 1000) / 10,
  }));

  const cohorts = [...cohortBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-COHORT_WEEKS)
    .map(([weekStart, bucket]) => ({
      cohortWeek: weekStart,
      cohortSize: bucket.visitors.size,
      weeks: Array.from({ length: COHORT_WEEKS }, (_, weekIndex) => {
        const activeCount = bucket.activeByWeek.get(weekIndex)?.size ?? 0;
        return {
          weekIndex,
          retentionRate: bucket.visitors.size === 0 ? 0 : Math.round((activeCount / bucket.visitors.size) * 1000) / 10,
        };
      }),
    }));

  return { retention: retentionSummary, returningUsers, totalVisitorsInWindow: rows.length, cohorts };
}
