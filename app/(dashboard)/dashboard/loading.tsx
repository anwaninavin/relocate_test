import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="items-center justify-center gap-2 p-6 lg:col-span-1">
          <Skeleton className="size-32 rounded-full" />
        </Card>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-3 p-5">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}
