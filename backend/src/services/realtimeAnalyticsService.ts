import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { getOnlineVisitors } from "@/services/eventService";
import { daysAgo } from "@/lib/dateRange";

/** Live/real-time dashboard data. Presence (who's online right now) comes from the in-memory
 * map maintained by eventService as events stream in; recent registrations/logins are a
 * cheap indexed query over the last few minutes. Polled by the dashboard (see
 * frontend features/admin-analytics/realtime-view.tsx) rather than pushed over a socket —
 * simplest thing that works at this scale; see README "Future improvements" for a
 * WebSocket/SSE upgrade path if traffic ever needs sub-poll-interval freshness. */
export async function getRealtimeSnapshot() {
  await connectDB();
  const window = daysAgo(0, new Date());
  window.setMinutes(window.getMinutes() - 15);

  const online = getOnlineVisitors();

  const [recentRegistrations, recentLogins] = await Promise.all([
    AnalyticsEvent.find({ eventName: "registration_success", timestamp: { $gte: window } })
      .sort({ timestamp: -1 })
      .limit(20)
      .select("timestamp geo device")
      .lean(),
    AnalyticsEvent.find({ eventName: "login_success", timestamp: { $gte: window } })
      .sort({ timestamp: -1 })
      .limit(20)
      .select("timestamp geo device")
      .lean(),
  ]);

  return {
    onlineCount: online.length,
    liveVisitors: online
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 100)
      .map((v) => ({
        visitorId: v.visitorId,
        page: v.page,
        country: v.country,
        device: v.deviceType,
        browser: v.browser,
        loggedIn: Boolean(v.userId),
        lastSeen: new Date(v.lastSeen).toISOString(),
      })),
    recentRegistrations: recentRegistrations.map((r) => ({
      timestamp: r.timestamp,
      country: r.geo?.country ?? null,
      device: r.device?.type ?? null,
    })),
    recentLogins: recentLogins.map((r) => ({
      timestamp: r.timestamp,
      country: r.geo?.country ?? null,
      device: r.device?.type ?? null,
    })),
  };
}
