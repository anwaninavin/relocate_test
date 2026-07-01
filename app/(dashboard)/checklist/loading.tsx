import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ChecklistLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="gap-3 p-5">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
