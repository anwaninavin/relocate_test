import { useEffect, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { LISTING_TYPES } from "@/types";
import type { AdminListingDTO } from "@/features/admin/listing-dto";

const listingSchema = z.object({
  type: z.enum(LISTING_TYPES),
  city: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(150),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  rent: z.coerce.number().min(0).optional(),
  deposit: z.coerce.number().min(0).optional(),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  contactName: z.string().trim().max(80).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
  mapsLink: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  featured: z.boolean(),
});

type ListingInput = z.infer<typeof listingSchema>;

export function ListingFormDialog({ listing, trigger }: { listing?: AdminListingDTO; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(listing);

  function buildDefaults(): ListingInput {
    return {
      type: listing?.type ?? LISTING_TYPES[0],
      city: listing?.city ?? "",
      title: listing?.title ?? "",
      imageUrl: listing?.imageUrl ?? "",
      rent: listing?.rent ?? undefined,
      deposit: listing?.deposit ?? undefined,
      address: listing?.address ?? "",
      contactName: listing?.contactName ?? "",
      contactPhone: listing?.contactPhone ?? "",
      mapsLink: listing?.mapsLink ?? "",
      description: listing?.description ?? "",
      featured: listing?.featured ?? false,
    };
  }

  const form = useForm<ListingInput>({
    resolver: zodResolver(listingSchema) as Resolver<ListingInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: ListingInput) {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/api/admin/listings/${listing!.id}`, values);
      } else {
        await api.post("/api/admin/listings", values);
      }
      emitRefresh();
      toast.success(isEdit ? "Listing updated" : "Listing added");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add listing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit listing" : "Add listing"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-1">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Sunrise Boys PG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Pune" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LISTING_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent (₹/mo)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mapsLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.google.com/…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <FormLabel>Feature this listing</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isEdit ? "Save changes" : "Add listing"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
