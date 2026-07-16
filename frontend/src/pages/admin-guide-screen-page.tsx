import { AdminTabs } from "@/features/admin/admin-tabs";
import { GuideScreenEditor } from "@/features/admin/guide-screen-editor";

export default function AdminGuideScreenPage() {
  return (
    <div>
      <AdminTabs />
      <GuideScreenEditor />
    </div>
  );
}
