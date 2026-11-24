import { test, expect } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"]) {
  test(`image scanner is accessible and cancellable with motion ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 320, height: 760 });
    let release;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/api/extract", async (route) => {
      await pending;
      await route
        .fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ classes: [], warnings: [] }),
        })
        .catch(() => {});
    });
    try {
      await page.goto("/");
      await page
        .getByLabel("Upload timetable image")
        .setInputFiles("tests/fixtures/timetable-sample.jpg");
      await expect(
        page.getByRole("heading", { name: "A little scan. A clearer week." }),
      ).toBeVisible();
      const image = page.getByAltText("Timetable being scanned");
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img) => img.naturalWidth))
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          image.evaluate((img) => {
            const canvas = img.parentElement.querySelector("canvas");
            return Math.abs(
              canvas.clientWidth / canvas.clientHeight -
                img.naturalWidth / img.naturalHeight,
            );
          }),
        )
        .toBeLessThan(0.02);
      await expect(
        page.getByRole("progressbar", { name: "Reading timetable" }),
      ).not.toHaveAttribute("aria-valuenow");
      await expect(
        page.getByText("timetable-sample.jpg", { exact: true }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      if (reducedMotion === "reduce") {
        await expect(page.locator(".image-scan-visual")).toHaveAttribute(
          "data-motion",
          "reduced",
        );
        expect(
          await page
            .locator(".scan-sweep")
            .evaluate(
              (element) => getComputedStyle(element, "::after").animationName,
            ),
        ).toBe("none");
        const particles = page.locator(".scan-particles");
        const before = await particles.evaluate((canvas) => canvas.toDataURL());
        await page.waitForTimeout(150);
        expect(await particles.evaluate((canvas) => canvas.toDataURL())).toBe(
          before,
        );
      }
      await page.getByRole("button", { name: "Cancel scanning" }).click();
      await expect(
        page.getByRole("button", { name: "Upload image" }),
      ).toBeVisible();
      await expect(page.getByAltText("Timetable being scanned")).toHaveCount(0);
    } finally {
      release();
    }
  });
}
