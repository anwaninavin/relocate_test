import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function NotesLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="gap-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  );
}
