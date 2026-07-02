import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Card className="gap-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </Card>
    </div>
  );
}
