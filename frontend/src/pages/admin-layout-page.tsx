import { AdminTabs } from "@/features/admin/admin-tabs";
import { LayoutEditorView } from "@/features/admin/layout-editor-view";

export default function AdminLayoutPage() {
  return (
    <div>
      <AdminTabs />
      <LayoutEditorView />
    </div>
  );
}
