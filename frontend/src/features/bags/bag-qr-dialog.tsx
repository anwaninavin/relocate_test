import { QRCodeSVG } from "qrcode.react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BagQrDialogProps {
  bagId: string;
  bagName: string;
  trigger: React.ReactNode;
}

/** One QR code per bag (never per item) — scanning it should later open every checklist
 * item currently assigned to this bag. */
export function BagQrDialog({ bagId, bagName, trigger }: BagQrDialogProps) {
  const url = `${window.location.origin}/bags/${bagId}`;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{bagName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-xl border bg-white p-4">
            <QRCodeSVG value={url} size={200} />
          </div>
          <p className="text-muted-foreground text-center text-xs">
            Scan to open this bag's checklist items.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
