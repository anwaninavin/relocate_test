import { useState } from "react";
import { Check, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import {
  toCollegeCategoryDTO,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
} from "@/features/auth/college-taxonomy-dto";

interface RecommendedItem {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  estimatedPrice: number | null;
  added: boolean;
}

/** "Pack with me": pick an education category, then browse the catalog's recommended items for
 * it and add any straight into your own checklist. Independent of the user's own saved college
 * category, so they can browse what another stream typically packs too. */
export function PackWithMe() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CollegeCategoryDTO[] | null>(null);
  const [collegeCategoryId, setCollegeCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RecommendedItem[] | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && categories === null) {
      api
        .get<{ collegeCategories: CollegeCategoryRaw[] }>("/api/college-categories")
        .then(({ collegeCategories }) => setCategories(collegeCategories.map(toCollegeCategoryDTO)))
        .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load categories"));
    }
  }

  async function handleGoForIt() {
    if (!collegeCategoryId) {
      toast.error("Pick your education category");
      return;
    }
    setLoading(true);
    try {
      const result = await api.get<{ items: RecommendedItem[] }>(
        `/api/checklist/recommendations?collegeCategoryId=${collegeCategoryId}`,
      );
      setItems(result.items);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(item: RecommendedItem) {
    setAddingId(item.id);
    try {
      await api.post(`/api/checklist/recommendations/${item.id}/add`, {});
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, added: true } : i)) ?? prev);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add item");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
      <div className="flex justify-center">
        <Button type="button" onClick={() => handleOpenChange(true)} className="gap-2">
          <Sparkles className="size-4" />
          Pack with me
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>What are you studying?</DialogTitle>
            <DialogDescription>
              Pick your education category and we'll recommend what to pack.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Education category</Label>
            <Select value={collegeCategoryId} onValueChange={setCollegeCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleGoForIt} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Go for it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {items !== null && (
        <div className="mt-5 rounded-2xl border border-[#e9ddc9] bg-white p-4 shadow-sm sm:p-6">
          <p
            className="mb-3 text-2xl text-[#3a2e2a] sm:text-3xl"
            style={{ fontFamily: "var(--font-caveat-notebook)" }}
          >
            Recommended for you
          </p>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recommendations for this category yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-dashed divide-[#e9ddc9]">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{item.category}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.added ? "outline" : "default"}
                    disabled={item.added || addingId === item.id}
                    onClick={() => handleAdd(item)}
                  >
                    {addingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : item.added ? (
                      <Check className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {item.added ? "Added" : "Add"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
