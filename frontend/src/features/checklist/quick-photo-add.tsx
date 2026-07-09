import { useRef, useState } from "react";
import { Camera, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { compressImageToDataUrl } from "@/lib/image-compression";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";

interface QuickPhotoAddProps {
  itemId: string;
  onUploaded: (url: string) => void;
  className?: string;
}

/** A compact "add photo" affordance for a checklist item that doesn't have one yet —
 * used where opening the full edit form would be overkill (e.g. the bag detail screen),
 * so a photo can be captured right where you're packing. Compresses on-device, uploads
 * to Cloudinary, then saves the returned URL straight onto the item. */
export function QuickPhotoAdd({ itemId, onUploaded, className }: QuickPhotoAddProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const { url } = await api.post<{ url: string }>("/api/uploads/image", { image: dataUrl });
      await api.patch(`/api/checklist/${itemId}`, { imageUrl: url });
      emitRefresh();
      onUploaded(url);
      toast.success("Photo added");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add photo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      aria-label="Add photo"
      title="Add photo"
      className={cn(
        "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground relative flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-60",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <>
          <Camera className="size-5" />
          <span className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full">
            <Plus className="size-2.5" />
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </button>
  );
}
