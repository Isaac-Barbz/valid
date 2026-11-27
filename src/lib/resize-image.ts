/**
 * Browser-side image shrink before upload ($0 budget: no image services).
 * Scales down to `maxWidth` and re-encodes as WebP.
 */
export async function resizeToWebp(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Couldn't process that image.");
  return new File([blob], "image.webp", { type: "image/webp" });
}
