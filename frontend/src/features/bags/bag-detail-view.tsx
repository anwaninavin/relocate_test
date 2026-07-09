import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ImageIcon, Pencil, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import { BagQrDialog } from "@/features/bags/bag-qr-dialog";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";
import NotFound from "@/pages/not-found";

export function BagDetailView({ bagId }: { bagId: string }) {
  const navigate = useNavigate();
  const [bagName, setBagName] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItemDTO[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchData() {
    try {
      const data = await api.get<{ bag: { id: string; name: string }; items: ChecklistItemRaw[] }>(
        `/api/bags/${bagId}`,
      );
      setBagName(data.bag.name);
      setItems(data.items.map(toChecklistItemDTO));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Failed to load bag");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagId]);

  async function toggleCompleted(item: ChecklistItemDTO) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    try {
      await api.patch(`/api/checklist/${item.id}`, { completed: !item.completed });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i)));
    }
  }

  async function handleRename() {
    const name = renameValue.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/api/bags/${bagId}`, { name });
      emitRefresh();
      toast.success("Bag renamed");
      setRenaming(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to rename bag");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/api/bags/${bagId}`);
      emitRefresh();
      toast.success("Bag deleted");
      navigate("/bags");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete bag");
    }
  }

  if (loading) return null;
  if (notFound || !bagName) return <NotFound />;

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="pb-24">
      <Link
        to="/bags"
        className="text-muted-foreground mb-3 inline-flex items-center gap-1 text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All bags
      </Link>

      <PageHeader
        title={bagName}
        description={`${completedCount} / ${items.length} items packed`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRenameValue(bagName);
                setRenaming(true);
              }}
            >
              <Pencil className="size-4" />
              Rename
            </Button>
            <BagQrDialog
              bagId={bagId}
              bagName={bagName}
              trigger={
                <Button variant="outline" size="sm">
                  <QrCode className="size-4" />
                  QR
                </Button>
              }
            />
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              }
              title="Delete this bag?"
              description="Items assigned to it will become unassigned, not deleted."
              onConfirm={handleDelete}
            />
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No items in this bag yet"
          description="Assign checklist items to this bag from the Checklist tab."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="flex-row items-center gap-3 p-3">
              <Checkbox checked={item.completed} onCheckedChange={() => toggleCompleted(item)} />

              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.item}
                  className="size-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
                  <ImageIcon className="size-5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className={item.completed ? "text-muted-foreground truncate text-sm line-through" : "truncate text-sm font-medium"}>
                  {item.item}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                {item.notes && <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{item.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={renaming} onOpenChange={setRenaming}>
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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
