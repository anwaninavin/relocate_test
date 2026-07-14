import { useState } from "react";
import { Compass, Star } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceFormDialog } from "@/features/admin/place-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { AdminPlaceDTO } from "@/features/admin/place-dto";

export function PlacesAdminView({ places: initialPlaces }: { places: AdminPlaceDTO[] }) {
  const [places, setPlaces] = useState(initialPlaces);
  const [cityFilter, setCityFilter] = useState("");

  async function handleDelete(id: string) {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/api/admin/places/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete place");
    }
  }

  const filtered = cityFilter
    ? places.filter((p) => p.city.toLowerCase().includes(cityFilter.toLowerCase()))
    : places;

  return (
    <div>
      <PageHeader
        title="Places"
        description="Places to Explore entries shown to students by destination city"
        action={<PlaceFormDialog />}
      />

      <Input
        placeholder="Filter by city…"
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Compass} title="No places yet" description="Add your first place to explore." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((place) => (
                <TableRow key={place.id}>
                  <TableCell className="font-medium">{place.name}</TableCell>
                  <TableCell>{place.city}</TableCell>
                  <TableCell>{place.category}</TableCell>
                  <TableCell>
                    {place.rating != null ? (
                      <span className="flex items-center gap-1">
                        <Star className="fill-warning text-warning size-3.5" />
                        {place.rating.toFixed(1)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{place.featured ? <Badge variant="accent">Featured</Badge> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <PlaceFormDialog place={place} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                      <ConfirmDialog
                        trigger={<Button variant="outline" size="sm">Delete</Button>}
                        title="Delete this place?"
                        description="Students will no longer see this entry."
                        onConfirm={() => handleDelete(place.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
