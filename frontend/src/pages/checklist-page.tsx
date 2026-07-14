import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import { ChecklistOverview } from "@/features/checklist/checklist-overview";
import { NotebookView } from "@/features/checklist/notebook-view";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";

interface CategoryGroup {
  category: string;
  items: ChecklistItemDTO[];
}

/** Manual fallback for when the checklist doesn't auto-populate on registration (e.g. an
 * environment where the starter catalog hasn't been seeded yet) — only shown while the
 * checklist is genuinely empty, and hides itself the moment items exist. */
function LoadStarterChecklistBanner() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLoad() {
    setIsLoading(true);
    try {
      const result = await api.post<{ count: number }>("/api/checklist/load-starter");
      emitRefresh();
      toast.success(
        result.count > 0
          ? `Added ${result.count} item${result.count === 1 ? "" : "s"} from the starter checklist`
          : "You already have every starter checklist item",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mb-4 flex-row items-center gap-3 p-3">
      <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="text-primary size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Your checklist is empty</p>
        <p className="text-muted-foreground text-xs">Load the default packing list to get started</p>
      </div>
      <Button size="sm" onClick={handleLoad} disabled={isLoading}>
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        Load starter checklist
      </Button>
    </Card>
  );
}

export default function ChecklistPage() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { categories } = await api.get<{
        categories: { category: string; items: ChecklistItemRaw[] }[];
      }>("/api/checklist");
      setGroups(
        categories.map((g) => ({
          category: g.category,
          items: g.items.map(toChecklistItemDTO),
        })),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load checklist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  if (loading) return null;

  const overall = groups.reduce(
    (acc, g) => ({
      total: acc.total + g.items.length,
      completed: acc.completed + g.items.filter((i) => i.completed).length,
    }),
    { total: 0, completed: 0 },
  );
  const allCategories = groups.map((g) => g.category);
  const view = searchParams.get("view");
  const bulkEdit = searchParams.get("bulkEdit");
  const showLoadStarterBanner = overall.total === 0;

  if (view === "list" || bulkEdit === "1") {
    return (
      <>
        {showLoadStarterBanner && <LoadStarterChecklistBanner />}
        <ChecklistOverview groups={groups} overall={overall} initialBulkEdit={bulkEdit === "1"} />
      </>
    );
  }

  return (
    <>
      {showLoadStarterBanner && <LoadStarterChecklistBanner />}
      <NotebookView groups={groups} overall={overall} allCategories={allCategories} />
    </>
  );
}
