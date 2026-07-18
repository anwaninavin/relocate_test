import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddToBagList } from "@/features/bags/add-to-bag-list";

interface AddToBagDialogProps {
  itemId: string;
  itemName: string;
  bagId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Add to Bag" from a checklist item's three-dot menu: shows every bag the user already
 * has (tap to assign) plus an inline "New bag" option, so assigning never requires
 * leaving the checklist. */
export function AddToBagDialog({ itemId, itemName, bagId, open, onOpenChange }: AddToBagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">Add to bag</DialogTitle>
          <p className="text-muted-foreground truncate text-sm">"{itemName}"</p>
        </DialogHeader>
        <AddToBagList itemId={itemId} bagId={bagId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
