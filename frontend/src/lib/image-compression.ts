/**
 * Client-side photo compression for checklist item photos: downscale + re-encode as JPEG,
 * shrinking quality then dimensions until the result fits under the target size. Avoids
 * pulling in an extra dependency for what's a handful of canvas calls.
 */
const TARGET_BYTES = 100 * 1024;
const MAX_DIMENSION = 1280;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

/** Compresses an image file down to (ideally) under `targetBytes` and returns it as a
 * base64 data URI, ready to store directly on a checklist item. */
export async function compressImageToDataUrl(
  file: File,
  targetBytes = TARGET_BYTES,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Image is too large to process");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images");

  let scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  let quality = 0.8;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, quality);

    if (blob && blob.size <= targetBytes) break;
    if (quality > 0.4) {
      quality -= 0.15;
    } else {
      scale *= 0.75;
    }
  }

  if (!blob) throw new Error("Failed to compress image");
  return blobToDataUrl(blob);
}
