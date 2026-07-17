import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { CAMPUS_TIP_CATEGORIES } from "@/types";
import { TipCard } from "@/features/campus/tip-card";
import { TipFormDialog } from "@/features/campus/tip-form-dialog";
import { toCampusTipDTO, type CampusTipDTO, type CampusTipRaw } from "@/features/campus/campus-tip-dto";

const ANY = "__any__";

/** @param city/@param college - the student's own campus, from their profile. Like Explore,
 * there's no campus picker: this page is about the one campus that's relevant to them. */
export function CampusTipsView({ city, college }: { city: string; college: string }) {
  const [category, setCategory] = useState("");
  // null until the first fetch resolves, so the page doesn't flash the empty state — same
  // pattern as places-view.
  const [tips, setTips] = useState<CampusTipDTO[] | null>(null);

  async function fetchTips() {
    const params = new URLSearchParams({ city, college });
    if (category) params.set("category", category);
    try {
      const { tips: raw } = await api.get<{ tips: CampusTipRaw[] }>(`/api/campus-tips?${params.toString()}`);
      setTips(raw.map(toCampusTipDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load tips");
    }
  }

  useEffect(() => {
    fetchTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, college, category]);

  /** New tips join at the top rather than re-sorting mid-read: a fresh tip has score 0 and
   * strict score-order would bury it instantly. Server order returns on the next fetch. */
  function handleCreated(tip: CampusTipDTO) {
    setTips((prev) => [tip, ...(prev ?? [])]);
  }

  function handleDeleted(id: string) {
    setTips((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={category || ANY} onValueChange={(v) => setCategory(v === ANY ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            {CAMPUS_TIP_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <TipFormDialog city={city} college={college} onSaved={handleCreated} />
        </div>
      </div>

      {tips === null ? null : tips.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No tips yet"
          description={`Know something useful about ${college}? Be the first to share it.`}
          action={<TipFormDialog city={city} college={college} onSaved={handleCreated} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
