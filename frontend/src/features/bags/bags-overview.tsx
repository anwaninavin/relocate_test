import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Luggage, Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import { BagQrDialog } from "@/features/bags/bag-qr-dialog";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

export function BagsOverview() {
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<BagSummaryDTO | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.post("/api/bags", { name });
      emitRefresh();
      toast.success("Bag added");
      setCreating(false);
      setNewName("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add bag");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRename() {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/api/bags/${renameTarget.id}`, { name });
      emitRefresh();
      toast.success("Bag renamed");
      setRenameTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to rename bag");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/bags/${id}`);
      emitRefresh();
      toast.success("Bag deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete bag");
    }
  }

  if (bags === null) return null;

  const action = creating ? (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Bag name"
        className="w-40"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleCreate();
          }
        }}
      />
      <Button size="sm" onClick={handleCreate} disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Add"}
      </Button>
      <Button
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
  ) : (
    <Button size="sm" onClick={() => setCreating(true)}>
      <Plus className="size-4" />
      New bag
    </Button>
  );

  return (
    <div className="pb-24">
      <PageHeader
        title="Bags"
        description="Group your checklist items by which bag they're packed in."
        action={action}
      />

      {bags.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="No bags yet"
          description="Create a bag, then assign checklist items to it from the Checklist tab."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bags.map((bag) => {
            const percent = bag.total > 0 ? Math.round((bag.completed / bag.total) * 100) : 0;
            return (
              <Card key={bag.id} className="gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/bags/${bag.id}`} className="min-w-0 flex-1">
                    <p className="font-display truncate font-semibold">{bag.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {bag.completed} / {bag.total} packed
                    </p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Bag options">
                        <Pencil className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setRenameTarget(bag);
                          setRenameValue(bag.name);
                        }}
                      >
                        <Pencil className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      <BagQrDialog
                        bagId={bag.id}
                        bagName={bag.name}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <QrCode className="size-4" />
                            QR code
                          </DropdownMenuItem>
                        }
                      />
                      <ConfirmDialog
                        trigger={
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        }
                        title="Delete this bag?"
                        description="Items assigned to it will become unassigned, not deleted."
                        onConfirm={() => handleDelete(bag.id)}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Progress value={percent} />
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename bag</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
          />
          <DialogFooter>
            <Button onClick={handleRename} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
