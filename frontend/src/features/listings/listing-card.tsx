import { MapPin, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ListingDTO } from "@/features/listings/listing-dto";

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ListingCard({ listing }: { listing: ListingDTO }) {
  async function share() {
    const shareData = {
      title: listing.title,
      text: listing.description,
      url: listing.mapsLink ?? window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast.success("Link copied to clipboard");
  }

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      {listing.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{listing.title}</p>
            <Badge variant="outline" className="mt-1">
              {listing.type}
            </Badge>
          </div>
          {listing.rent != null && (
            <span className="shrink-0 text-sm font-semibold">
              {formatRupees(listing.rent)}
              <span className="text-muted-foreground font-normal">/mo</span>
            </span>
          )}
        </div>

        {listing.address && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3 shrink-0" /> {listing.address}
          </p>
        )}
        {listing.deposit != null && (
          <p className="text-muted-foreground text-xs">Deposit: {formatRupees(listing.deposit)}</p>
        )}
        {(listing.contactName || listing.contactPhone) && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Phone className="size-3 shrink-0" />
            {[listing.contactName, listing.contactPhone].filter(Boolean).join(" · ")}
          </p>
        )}
        {listing.description && <p className="text-muted-foreground text-sm">{listing.description}</p>}

        <div className="mt-2 flex items-center gap-2">
          {listing.mapsLink && (
            <Button asChild size="sm" variant="outline">
              <a href={listing.mapsLink} target="_blank" rel="noreferrer">
                View on Maps
              </a>
            </Button>
          )}
          {listing.contactPhone && (
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${listing.contactPhone}`}>Call</a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={share}>
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
