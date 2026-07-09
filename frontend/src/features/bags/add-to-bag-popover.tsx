import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

interface AddToBagPopoverProps {
  itemId: string;
  bagId: string | null;
  trigger: React.ReactNode;
}

/** Quick "Add to Bag" action from a checklist row — a fast, non-blocking way to assign an
 * item to a suitcase without opening the full edit form. The item stays on the checklist
 * either way; a bag only ever holds a reference (bagId), never a copy of the item.
 * Selecting the bag the item is already in unassigns it (one bag per item, toggled). */
export function AddToBagPopover({ itemId, bagId, trigger }: AddToBagPopoverProps) {
  const [open, setOpen] = useState(false);
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBags(null);
    api
      .get<{ bags: BagSummaryDTO[] }>("/api/bags")
      .then((data) => setBags(data.bags))
      .catch(() => setBags([]));
  }, [open]);

  async function handleSelect(bag: BagSummaryDTO) {
    const alreadyAssigned = bagId === bag.id;
    setPendingId(bag.id);
    try {
      await api.patch(`/api/checklist/${itemId}`, { bagId: alreadyAssigned ? null : bag.id });
      emitRefresh();
      toast.success(alreadyAssigned ? `Removed from ${bag.name}` : `Added to ${bag.name}`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update bag");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="text-muted-foreground px-2 py-1 text-xs font-semibold">Add to Bag</p>
        {bags === null ? (
          <div className="flex justify-center py-3">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : bags.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-sm">
            No bags yet — create one from the Bags tab.
          </p>
        ) : (
          <div className="flex flex-col">
            {bags.map((bag) => {
              const isAssigned = bagId === bag.id;
              return (
                <button
                  key={bag.id}
                  type="button"
                  disabled={pendingId !== null}
                  onClick={() => handleSelect(bag)}
                  className="hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm disabled:opacity-60"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: bag.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-left">{bag.name}</span>
                  {pendingId === bag.id ? (
                    <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                  ) : (
                    isAssigned && <Check className="text-primary size-4 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
