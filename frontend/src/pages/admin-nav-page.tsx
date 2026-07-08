import { AdminTabs } from "@/features/admin/admin-tabs";
import { NavEditorView } from "@/features/admin/nav-editor-view";

export default function AdminNavPage() {
  return (
    <div>
      <AdminTabs />
      <NavEditorView />
    </div>
  );
}
