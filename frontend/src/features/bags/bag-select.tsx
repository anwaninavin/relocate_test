import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

const NONE_BAG = "__none__";
const NEW_BAG_VALUE = "__new_bag__";

interface BagSelectProps {
  value: string | null;
  onChange: (bagId: string | null) => void;
}

/** Assigns a checklist item to a bag. Bags themselves are just a name — the "Bags" tab
 * groups items by this reference, it never stores its own item list. */
export function BagSelect({ value, onChange }: BagSelectProps) {
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ bags: BagSummaryDTO[] }>("/api/bags")
      .then((data) => setBags(data.bags))
      .catch(() => setBags([]));
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const { bag } = await api.post<{ bag: { id: string; name: string; color: string } }>(
        "/api/bags",
        { name },
      );
      toast.success("Bag added");
      setBags((prev) => [...(prev ?? []), { ...bag, total: 0, completed: 0 }]);
      onChange(bag.id);
      setCreating(false);
      setNewName("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add bag");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (creating) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New bag name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button type="button" size="sm" onClick={handleCreate} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Add"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setCreating(false);
            setNewName("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value ?? NONE_BAG}
      onValueChange={(v) => {
        if (v === NEW_BAG_VALUE) setCreating(true);
        else onChange(v === NONE_BAG ? null : v);
      }}
      disabled={bags === null}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select bag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_BAG}>No bag</SelectItem>
        {(bags ?? []).map((b) => (
          <SelectItem key={b.id} value={b.id}>
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: b.color }}
              />
              {b.name}
            </span>
          </SelectItem>
        ))}
        <SelectItem value={NEW_BAG_VALUE}>
          <Plus className="size-4" />
          New bag
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
