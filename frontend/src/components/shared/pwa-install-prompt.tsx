import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";

import { usePwaInstall } from "@/lib/use-pwa-install";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "pwa-install-dismissed";
const SHOW_DELAY_MS = 2500;

export function PWAInstallPrompt() {
  const { installed, isIOS, canInstall, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(DISMISSED_KEY) === "1",
  );

  useEffect(() => {
    if (installed || dismissed || !(canInstall || isIOS)) return;
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [installed, dismissed, canInstall, isIOS]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstall() {
    if (isIOS && !canInstall) return;
    const outcome = await promptInstall();
    if (outcome === "accepted" || outcome === "dismissed") dismiss();
  }

  return (
    <AnimatePresence>
      {visible && !installed && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6"
        >
          <div className="glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl p-4 shadow-xl">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
              <Download className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Install Pack with Me</p>
              <p className="text-muted-foreground text-xs">
                {isIOS ? (
                  <>
                    Tap <Share className="mx-0.5 inline size-3" aria-hidden /> Share, then{" "}
                    <SquarePlus className="mx-0.5 inline size-3" aria-hidden /> "Add to Home Screen"
                  </>
                ) : (
                  "Add it to your home screen for faster, offline-ready access."
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!isIOS && (
                <Button size="sm" onClick={handleInstall}>
                  Install
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={dismiss}
                aria-label="Dismiss install prompt"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
