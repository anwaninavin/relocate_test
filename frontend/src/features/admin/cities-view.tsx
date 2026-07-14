import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { CityFormDialog } from "@/features/admin/city-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { AdminCityDTO } from "@/features/admin/city-dto";

export function CitiesView({ cities: initialCities }: { cities: AdminCityDTO[] }) {
  const [cities, setCities] = useState(initialCities);

  async function handleDelete(id: string) {
    setCities((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.delete(`/api/admin/cities/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete city");
    }
  }

  return (
    <div>
      <PageHeader title="Cities" description="Reference cities used across discovery, bookings, and places" action={<CityFormDialog />} />

      {cities.length === 0 ? (
        <EmptyState icon={MapPin} title="No cities yet" description="Add your first city." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.state || "—"}</TableCell>
                  <TableCell>{city.featured ? <Badge variant="accent">Featured</Badge> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <CityFormDialog city={city} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                      <ConfirmDialog
                        trigger={<Button variant="outline" size="sm">Delete</Button>}
                        title="Delete this city?"
                        description="It will no longer appear in city pickers."
                        onConfirm={() => handleDelete(city.id)}
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
