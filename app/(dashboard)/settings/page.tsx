import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listCategories } from "@/services/categoryService";
import { SettingsView } from "@/features/settings/settings-view";

export const metadata: Metadata = { title: "Settings — Pack with Me" };

export default async function SettingsPage() {
  const session = await auth();
  const categories = await listCategories(session!.user.id);

  return <SettingsView categories={categories.map((c) => c.name)} />;
}
