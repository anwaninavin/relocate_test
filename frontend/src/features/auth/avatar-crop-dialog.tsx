import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VIEWPORT_SIZE = 280; // CSS px — square crop area behind the circular guide
const OUTPUT_SIZE = 640; // px — cropped output resolution; compressImageToDataUrl shrinks it further
const MAX_ZOOM = 3;

interface Point {
  x: number;
  y: number;
}

interface AvatarCropDialogProps {
  /** Data URL of the freshly-picked file, or null to keep the dialog closed. */
  imageSrc: string | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/** Pan-and-zoom crop step shown after picking a profile photo, before it's compressed and
 * uploaded — lets the user frame their face instead of getting whatever rectangle the source
 * photo happened to have. Always crops to a square (the same shape Avatar masks to a circle),
 * hand-rolled with canvas + pointer events rather than a dependency, matching
 * image-compression.ts's existing no-extra-deps approach to image handling. */
export function AvatarCropDialog({ imageSrc, busy, onCancel, onConfirm }: AvatarCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const dragRef = useRef<{ start: Point; origin: Point } | null>(null);

  // Reset framing whenever a new photo is picked.
  useEffect(() => {
    setNaturalSize(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  function coverScale(w: number, h: number) {
    return VIEWPORT_SIZE / Math.min(w, h);
  }

  // Keeps the image covering the whole viewport square — no empty edges to drag into.
  function clampOffset(pos: Point, w: number, h: number, scale: number): Point {
    const minX = Math.min(0, VIEWPORT_SIZE - w * scale);
    const minY = Math.min(0, VIEWPORT_SIZE - h * scale);
    return {
      x: Math.min(0, Math.max(minX, pos.x)),
      y: Math.min(0, Math.max(minY, pos.y)),
    };
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = coverScale(w, h);
    setNaturalSize({ w, h });
    setOffset(clampOffset({ x: (VIEWPORT_SIZE - w * scale) / 2, y: (VIEWPORT_SIZE - h * scale) / 2 }, w, h, scale));
  }

  function handleZoomChange(nextZoom: number) {
    if (!naturalSize) return;
    const { w, h } = naturalSize;
    const oldScale = coverScale(w, h) * zoom;
    const newScale = coverScale(w, h) * nextZoom;
    // Re-anchor on the viewport's center so zooming doesn't yank the frame sideways.
    const centerImgX = (VIEWPORT_SIZE / 2 - offset.x) / oldScale;
    const centerImgY = (VIEWPORT_SIZE / 2 - offset.y) / oldScale;
    setZoom(nextZoom);
    setOffset(
      clampOffset(
        { x: VIEWPORT_SIZE / 2 - centerImgX * newScale, y: VIEWPORT_SIZE / 2 - centerImgY * newScale },
        w,
        h,
        newScale,
      ),
    );
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!naturalSize) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { start: { x: e.clientX, y: e.clientY }, origin: offset };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !naturalSize) return;
    const { w, h } = naturalSize;
    const scale = coverScale(w, h) * zoom;
    const next = {
      x: dragRef.current.origin.x + (e.clientX - dragRef.current.start.x),
      y: dragRef.current.origin.y + (e.clientY - dragRef.current.start.y),
    };
    setOffset(clampOffset(next, w, h, scale));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    if (!naturalSize || !imgRef.current) return;
    const scale = coverScale(naturalSize.w, naturalSize.h) * zoom;
    const sourceSize = VIEWPORT_SIZE / scale;
    const sourceX = -offset.x / scale;
    const sourceY = -offset.y / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => blob && onConfirm(blob), "image/jpeg", 0.92);
  }

  const scale = naturalSize ? coverScale(naturalSize.w, naturalSize.h) * zoom : 1;

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>Drag to reposition, and use the slider to zoom.</DialogDescription>
        </DialogHeader>

        <div
          className="bg-muted relative mx-auto touch-none overflow-hidden rounded-lg"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              className="absolute top-0 left-0 max-w-none origin-top-left touch-none select-none"
              style={{
                width: naturalSize?.w,
                height: naturalSize?.h,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              }}
            />
          )}
          {/* Visual guide only — the saved crop is the full square behind it, matching how
              the Avatar component masks the result round. */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>

        <div className="flex items-center gap-3 px-1">
          <ZoomIn className="text-muted-foreground size-4 shrink-0" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            disabled={!naturalSize}
            aria-label="Zoom"
            className="accent-primary w-full"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy || !naturalSize}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Use photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
