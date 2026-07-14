import { AdminTabs } from "@/features/admin/admin-tabs";
import { AdminAnalyticsDashboardView } from "@/features/admin-analytics/admin-analytics-dashboard-view";

export default function AdminAnalyticsProPage() {
  return (
    <div>
      <AdminTabs />
      <AdminAnalyticsDashboardView />
    </div>
  );
}
