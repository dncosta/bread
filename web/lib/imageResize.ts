/**
 * Resizes/compresses an image file in the browser before upload — admin
 * photos come straight from a phone camera (several MB) but only ever
 * render in a small square card, so there's no reason to upload them
 * full-size. Returns a WebP blob, longest side capped at 1000px.
 */
export async function resizeImageForUpload(file: File, maxDim = 1000, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/webp",
      quality
    );
  });
}
