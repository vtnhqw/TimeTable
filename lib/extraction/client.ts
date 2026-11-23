import { ExtractionResultSchema, type ExtractionResult } from "../schema.ts";
import { validateImageFile } from "./upload.ts";
export type ProgressCallback = (progress: number, status: string) => void;

/** Convert browser-supported formats to JPEG without cropping away any classes. */
export async function prepareUpload(
  file: File,
  signal?: AbortSignal,
): Promise<Blob> {
  signal?.throwIfAborted();
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        img.onload = null;
        img.onerror = null;
      };
      const abort = () => {
        cleanup();
        img.src = "";
        reject(signal?.reason ?? new Error("Image decoding timed out."));
      };
      const timer = setTimeout(abort, 20000);
      signal?.addEventListener("abort", abort, { once: true });
      img.onload = () => {
        cleanup();
        resolve(img);
      };
      img.onerror = () => {
        cleanup();
        reject(
          new Error(
            "This image could not be opened. Export it as PNG or JPEG and try again.",
          ),
        );
      };
      img.src = url;
    });
    signal?.throwIfAborted();
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height) throw new Error("This image is empty or damaged.");
    const scale = Math.min(
      1,
      4096 / Math.max(width, height),
      Math.sqrt(6_000_000 / (width * height)),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("This image could not be prepared.")),
        "image/jpeg",
        0.95,
      ),
    );
    signal?.throwIfAborted();
    if (blob.size > 11 * 1024 * 1024)
      throw new Error(
        "This image is too detailed to upload. Crop it to the timetable and try again.",
      );
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractTimetableFromImage(
  file: File,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
): Promise<ExtractionResult> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) cancel();
  const timeout = setTimeout(
    () =>
      controller.abort(
        new Error("Reading the image took too long. Please try again."),
      ),
    110_000,
  );
  try {
    onProgress?.(10, "Preparing your image…");
    const image = await prepareUpload(file, controller.signal);
    onProgress?.(30, "Sending the image to Gemini and reading every day…");
    const form = new FormData();
    form.set("image", image, "timetable.jpg");
    const response = await fetch("/api/extract", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an unreadable response. Please try again.",
      );
    }
    if (!response.ok)
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : "Image reading failed. Please try again.",
      );
    onProgress?.(90, "Checking the extracted classes…");
    const result = ExtractionResultSchema.safeParse(data);
    if (!result.success)
      throw new Error("The extracted timetable was invalid. Please try again.");
    onProgress?.(100, "Your timetable is ready to review.");
    return result.data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
