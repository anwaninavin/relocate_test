import { connectDB } from "@/db";
import { UiLayout } from "@/models/UiLayout";

export interface WidgetConfig {
  id: string;
  visible: boolean;
}

const DASHBOARD_PAGE = "dashboard";

export async function getDashboardLayout(): Promise<WidgetConfig[] | null> {
  await connectDB();
  const doc = await UiLayout.findOne({ page: DASHBOARD_PAGE }).lean();
  return doc?.widgets ?? null;
}

/** Admin-only: persists the widget order/visibility that every student's dashboard renders. */
export async function saveDashboardLayout(widgets: WidgetConfig[]): Promise<WidgetConfig[]> {
  await connectDB();
  await UiLayout.findOneAndUpdate(
    { page: DASHBOARD_PAGE },
    { widgets },
    { upsert: true },
  );
  return widgets;
}
