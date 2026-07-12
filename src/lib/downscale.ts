/**
 * Downscale a user's photo in the browser before upload.
 *
 * Phone cameras produce 4-12MB files. Gemini gains nothing from that resolution
 * for try-on, and the upload is the slowest part of the flow on Indian mobile
 * data — so we shrink first. Returns a JPEG data URL.
 */
export async function downscaleToDataUrl(
  file: File,
  maxEdge = 1280,
  quality = 0.9,
): Promise<string> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}
