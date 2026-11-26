import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const width of [320, 1440]) {
  test(`full screen preview matches the downloaded image and supports zoom at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Try a sample", exact: true })
      .click();
    await page.getByRole("button", { name: /Download/ }).click();
    const original = await page
      .locator("canvas")
      .evaluate((canvas) => canvas.toDataURL());
    const trigger = page.getByRole("button", {
      name: "View full screen",
      exact: true,
    });
    await trigger.click();
    const viewer = page.getByRole("dialog", {
      name: "Wallpaper preview",
      exact: true,
    });
    await expect(viewer).toBeVisible();
    await expect(viewer.locator(".phone-device")).toHaveCount(0);
    const canvas = viewer.locator("canvas");
    await expect
      .poll(() => canvas.evaluate((canvas) => canvas.toDataURL()))
      .toBe(original);
    const viewport = await viewer.boundingBox();
    expect(viewport.y).toBe(0);
    expect(viewport.x).toBe(0);
    expect(viewport.width).toBe(width);
    expect(viewport.height).toBe(900);
    await expect(
      viewer.getByText(
        "Zoom in for details. Swipe or scroll to explore the image.",
      ),
    ).toBeInViewport();
    const fitted = await canvas.boundingBox();
    expect(fitted.width).toBeLessThanOrEqual(width);
    expect(fitted.height).toBeLessThan(900);
    await viewer.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect
      .poll(async () => (await canvas.boundingBox()).width)
      .toBeGreaterThan(fitted.width);
    await viewer
      .getByRole("button", { name: "100% zoom", exact: true })
      .click();
    await expect
      .poll(() =>
        canvas.evaluate(
          (canvas) =>
            Math.round(canvas.getBoundingClientRect().width) === canvas.width,
        ),
      )
      .toBe(true);
    await expect(
      viewer.getByRole("button", { name: "Close full screen preview" }),
    ).toBeInViewport();
    await expect
      .poll(() =>
        viewer
          .locator(".wallpaper-viewer-stage")
          .evaluate((element) => element.scrollTop),
      )
      .toBeGreaterThan(0);
    await viewer
      .getByRole("button", { name: "Fit to screen", exact: true })
      .click();
    await expect
      .poll(async () => Math.round((await canvas.boundingBox()).width))
      .toBe(Math.round(fitted.width));
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download wallpaper", exact: true })
      .click();
    const file = await downloaded;
    expect((await readFile(await file.path())).toString("base64")).toBe(
      original.split(",")[1],
    );
    await page
      .getByRole("button", { name: "Switch wallpaper theme", exact: true })
      .click();
    await trigger.click();
    await expect
      .poll(() =>
        viewer.locator("canvas").evaluate((canvas) => canvas.toDataURL()),
      )
      .not.toBe(original);
    await viewer
      .getByRole("button", { name: "Close full screen preview" })
      .click();
    await expect(trigger).toBeFocused();
  });
}
