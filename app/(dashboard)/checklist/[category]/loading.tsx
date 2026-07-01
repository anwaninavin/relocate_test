import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ChecklistCategoryLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex-row items-center gap-3 p-4">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
