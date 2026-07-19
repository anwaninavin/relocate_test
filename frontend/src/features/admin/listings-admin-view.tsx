import { useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ListingFormDialog } from "@/features/admin/listing-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { AdminListingDTO } from "@/features/admin/listing-dto";

export function ListingsAdminView({ listings: initialListings }: { listings: AdminListingDTO[] }) {
  const [listings, setListings] = useState(initialListings);
  const [cityFilter, setCityFilter] = useState("");

  async function handleDelete(id: string) {
    setListings((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.delete(`/api/admin/listings/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete listing");
    }
  }

  const filtered = cityFilter
    ? listings.filter((l) => l.city.toLowerCase().includes(cityFilter.toLowerCase()))
    : listings;

  return (
    <div>
      <PageHeader
        title="Hostel, PG, Flat listings"
        description="Listings shown to students on the Hostel, PG, Flat browse page"
        action={<ListingFormDialog />}
      />

      <Input
        placeholder="Filter by city…"
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No listings yet" description="Add your first listing." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>{listing.city}</TableCell>
                  <TableCell>{listing.type}</TableCell>
                  <TableCell>{listing.rent != null ? `₹${listing.rent.toLocaleString("en-IN")}` : "—"}</TableCell>
                  <TableCell>{listing.featured ? <Badge variant="accent">Featured</Badge> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <ListingFormDialog listing={listing} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                      <ConfirmDialog
                        trigger={<Button variant="outline" size="sm">Delete</Button>}
                        title="Delete this listing?"
                        description="Students will no longer see this entry."
                        onConfirm={() => handleDelete(listing.id)}
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
