import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-3 p-5">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  );
}
