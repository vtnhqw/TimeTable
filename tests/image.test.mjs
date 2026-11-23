import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { installCanvasEnvironment } from "./helpers/canvas.mjs";
import { prepareUpload } from "../lib/extraction/client.ts";
import { validateImageFile } from "../lib/extraction/upload.ts";
installCanvasEnvironment();
test("original screenshot is prepared without removing any rows or margins", async () => {
  const bytes = await readFile(
    new URL("./fixtures/timetable-sample.jpg", import.meta.url),
  );
  const image = await prepareUpload(
    new File([bytes], "sample.jpg", { type: "image/jpeg" }),
  );
  assert.equal(image.type, "image/jpeg");
  assert.ok(image.size > 1000);
  const { loadImage } = await import("@napi-rs/canvas");
  const decoded = await loadImage(Buffer.from(await image.arrayBuffer()));
  assert.equal(decoded.width, 590);
  assert.equal(decoded.height, 1280);
});
test("cancelled and corrupt images fail before upload", async () => {
  await assert.rejects(
    prepareUpload(new File(["bad"], "sample.png", { type: "image/png" })),
    /opened/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    prepareUpload(
      new File(["bad"], "sample.png", { type: "image/png" }),
      controller.signal,
    ),
    { name: "AbortError" },
  );
});
test("upload validation handles supported types, empty, oversized and unsupported files", () => {
  assert.equal(
    validateImageFile({ size: 100, type: "image/webp", name: "test.webp" }),
    null,
  );
  assert.equal(
    validateImageFile({ size: 100, type: "", name: "test.jpg" }),
    null,
  );
  assert.ok(
    validateImageFile({ size: 0, type: "image/png", name: "test.png" }),
  );
  assert.ok(
    validateImageFile({
      size: 21 * 1024 * 1024,
      type: "image/png",
      name: "test.png",
    }),
  );
  assert.ok(
    validateImageFile({ size: 100, type: "application/pdf", name: "test.pdf" }),
  );
});
