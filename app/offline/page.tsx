import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="gradient-brand flex size-16 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
        <WifiOff className="size-8 text-white" />
      </div>
      <h1 className="font-display text-xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Hostel Essentials needs an internet connection to sync your checklist, budget, and other
        data. Reconnect and try again.
      </p>
      <a
        href="/dashboard"
        className="gradient-brand inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium text-white shadow-md shadow-primary/20"
      >
        Try again
      </a>
    </div>
  );
}
