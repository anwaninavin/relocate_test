import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { compressImageToDataUrl } from "@/lib/image-compression";

interface PhotoUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Optional single-photo picker for a checklist item. Compresses on-device to keep
 * items lightweight in the database — one photo per item, no cloud upload involved. */
export function PhotoUploadField({ value, onChange }: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setCompressing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      onChange(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process photo");
    } finally {
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border">
          <img src={value} alt="Item photo" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove photo"
            className="bg-background/90 absolute top-1 right-1 flex size-5 items-center justify-center rounded-full border"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div className="text-muted-foreground bg-muted flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed">
          <ImagePlus className="size-6" />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={compressing}
        onClick={() => inputRef.current?.click()}
      >
        {compressing && <Loader2 className="size-4 animate-spin" />}
        {value ? "Change photo" : "Add photo"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
