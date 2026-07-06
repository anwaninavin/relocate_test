import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { DEFAULT_DASHBOARD_LAYOUT, widgetLabel, type WidgetConfig } from "@/features/dashboard/widget-registry";

function SortableWidgetRow({
  config,
  onToggle,
}: {
  config: WidgetConfig;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: config.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-card flex items-center gap-3 rounded-xl border px-3 py-3 ${isDragging ? "z-10 shadow-lg" : ""} ${
        config.visible ? "" : "opacity-50"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-5" />
      </button>
      <span className="flex-1 text-sm font-medium">{widgetLabel(config.id)}</span>
      <button
        type="button"
        onClick={onToggle}
        className="text-muted-foreground hover:text-foreground"
        aria-label={config.visible ? "Hide section" : "Show section"}
      >
        {config.visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
      </button>
    </div>
  );
}

export function LayoutEditorView() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  useEffect(() => {
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/dashboard/layout")
      .then((res) => {
        if (res.widgets && res.widgets.length > 0) {
          setWidgets(res.widgets);
        }
      })
      .catch(() => {
        toast.error("Failed to load the current layout");
      });
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgets((current) => {
      const oldIndex = current.findIndex((w) => w.id === active.id);
      const newIndex = current.findIndex((w) => w.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
    setIsDirty(true);
  }

  function toggleVisible(id: string) {
    setWidgets((current) => current.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.put("/api/admin/layout", { widgets });
      toast.success("Dashboard layout saved");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard layout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Drag to reorder, tap the eye to show or hide a section. This applies to every student&apos;s dashboard, on
          both mobile and desktop.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {widgets.map((w) => (
                <SortableWidgetRow key={w.id} config={w} onToggle={() => toggleVisible(w.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button onClick={handleSave} disabled={!isDirty || isSaving} className="self-start">
          {isSaving ? "Saving..." : "Save layout"}
        </Button>
      </CardContent>
    </Card>
  );
}
