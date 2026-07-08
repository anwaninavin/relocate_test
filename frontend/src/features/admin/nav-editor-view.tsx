import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { DEFAULT_NAV_VISIBILITY, navItemLabel } from "@/features/nav/nav-visibility";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

export function NavEditorView() {
  const [items, setItems] = useState<WidgetConfig[]>(DEFAULT_NAV_VISIBILITY);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/nav/layout")
      .then((res) => {
        if (res.widgets && res.widgets.length > 0) {
          setItems(res.widgets);
        }
      })
      .catch(() => {
        toast.error("Failed to load the current nav visibility");
      });
  }, []);

  function toggleVisible(id: string) {
    setItems((current) => current.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.put("/api/admin/nav-layout", { widgets: items });
      toast.success("Nav visibility saved");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nav items</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Hide or show sidebar/menu items for every student. Hidden items also disappear from the quick-add (+)
          menu where applicable.
        </p>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-card flex items-center gap-3 rounded-xl border px-3 py-3 ${item.visible ? "" : "opacity-50"}`}
            >
              <span className="flex-1 text-sm font-medium">{navItemLabel(item.id)}</span>
              <button
                type="button"
                onClick={() => toggleVisible(item.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={item.visible ? "Hide item" : "Show item"}
              >
                {item.visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
              </button>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={!isDirty || isSaving} className="self-start">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
