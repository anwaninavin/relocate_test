import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Luggage, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AddBagDialog } from "@/features/bags/add-bag-dialog";
import { SuitcaseIcon } from "@/features/bags/suitcase-icon";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

/** Bags home: only bags the user has actually created, plus the "+ Add Bag" entry point.
 * No preset picker here — presets now live inside the create flow as tap-to-fill
 * suggestions, so this screen stays personal instead of a catalog to browse. */
export function BagsOverview() {
  const navigate = useNavigate();
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);

  async function fetchData() {
    try {
      const { bags } = await api.get<{ bags: BagSummaryDTO[] }>("/api/bags");
      setBags(bags);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load bags");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  if (bags === null) return null;

  return (
    <div className="pb-24">
      <PageHeader title="My Bags" description="Bags you've created — tap one to see what's packed inside." />

      {bags.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="No bags yet"
          description="Create your first bag to start organizing what you pack."
          action={
            <AddBagDialog
              trigger={
                <button
                  type="button"
                  className="bg-primary text-primary-foreground mt-1 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-sm"
                >
                  <Plus className="size-4" />
                  Add Bag
                </button>
              }
            />
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {bags.map((bag, i) => (
            <motion.button
              key={bag.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              onClick={() => navigate(`/bags/${bag.id}`)}
              className="border-border/60 bg-card flex flex-col items-center gap-2 rounded-2xl border p-4 text-center shadow-sm shadow-black/[0.02] transition-colors hover:border-primary/50"
              style={{ backgroundColor: `${bag.color}14` }}
            >
              <SuitcaseIcon color={bag.color} interactive={false} size={56} />
              <span className="font-display w-full truncate text-sm font-semibold">{bag.name}</span>
              <span className="text-muted-foreground text-xs">
                {bag.total > 0 ? `${bag.completed}/${bag.total} packed` : "empty"}
              </span>
            </motion.button>
          ))}

          <AddBagDialog
            trigger={
              <button
                type="button"
                className="border-primary/50 text-primary flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-sm font-medium transition-colors hover:bg-primary/5"
              >
                <span className="bg-primary/10 flex size-9 items-center justify-center rounded-full">
                  <Plus className="size-4" />
                </span>
                Add Bag
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
