import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="gap-3 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </Card>
      ))}
    </div>
  );
}
