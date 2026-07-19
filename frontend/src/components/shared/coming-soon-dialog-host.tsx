import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { subscribeComingSoon } from "@/lib/coming-soon-bus";

/** Mounted once (in DashboardLayout). Any nav item / home card the admin has turned "Live" off
 * for calls emitComingSoon(label) on click instead of navigating; this renders the resulting
 * popup. */
export function ComingSoonDialogHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeComingSoon(() => {
      setOpen(true);
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Coming soon</DialogTitle>
          <DialogDescription>Listing in progress. Live soon.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
