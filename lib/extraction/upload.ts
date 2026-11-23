export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp";
const SUPPORTED = new Set(IMAGE_ACCEPT.split(","));
const EXTENSIONS = /\.(png|jpe?g|webp|avif|gif|bmp)$/i;
export function validateImageFile(
  file: Pick<File, "size" | "type" | "name">,
): string | null {
  if (!file.size) return "This file is empty. Please choose a timetable image.";
  if (file.size > 20 * 1024 * 1024)
    return "This image is larger than 20 MB. Crop or resize it and try again.";
  if (
    !SUPPORTED.has(file.type) &&
    !(file.type === "" && EXTENSIONS.test(file.name))
  )
    return "Choose a PNG, JPEG, WebP, AVIF, GIF, or BMP image. Export HEIC or PDF files as an image first.";
  return null;
}
