"use client";

import { useState } from "react";
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
import { createCategoryAction } from "@/actions/categories";

const NEW_CATEGORY_VALUE = "__new_category__";

interface CategorySelectProps {
  categories: string[];
  value: string;
  onChange: (category: string) => void;
  onCategoryCreated?: (category: string) => void;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  onCategoryCreated,
}: CategorySelectProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;

    setIsSubmitting(true);
    const result = await createCategoryAction({ name });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Category added");
    onChange(name);
    onCategoryCreated?.(name);
    setCreating(false);
    setNewName("");
  }

  if (creating) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
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
      value={value}
      onValueChange={(v) => (v === NEW_CATEGORY_VALUE ? setCreating(true) : onChange(v))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
        <SelectItem value={NEW_CATEGORY_VALUE}>
          <Plus className="size-4" />
          New category
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
