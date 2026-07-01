"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="gradient-brand flex size-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
        <AlertTriangle className="size-7 text-white" />
      </div>
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        We couldn&apos;t load this page. This is usually temporary — check your connection and try
        again.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
