import { test, expect } from "@playwright/test";

test("existing schedule survives cancelled replacement and restore is explained", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await expect(
    page.getByText("Saved in this browser", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Previous schedule restored.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Try a sample", exact: true }),
  ).toHaveCount(0);
  for (const name of ["Start a blank schedule"]) {
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Back to review", exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Back to review", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Calculus II", exact: true }),
  ).toBeVisible();
});

test("manual entry uses the filtered day without a warning", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add manually", exact: true }).click();
  await expect(page.getByText("Review these details")).toHaveCount(0);
  await page.getByRole("button", { name: /Tue/ }).click();
  await page.getByRole("button", { name: "Add a class on Tuesday" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Tue", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("mobile preview sheet supports keyboard dismissal and larger swatches", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await page.getByRole("button", { name: "Continue to Style" }).click();
  const trigger = page.getByRole("button", {
    name: "View preview",
    exact: true,
  });
  await expect(trigger).toBeInViewport();
  await page.locator(".subject-color-row").last().scrollIntoViewIfNeeded();
  await expect(trigger).toBeInViewport();
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Live wallpaper preview" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const box = await page.locator(".color-swatch").first().boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("extraction failures offer a retry that recovers", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/extract", (route) => {
    attempts++;
    return route.fulfill({
      status: attempts === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        attempts === 1
          ? { error: "Reader unavailable" }
          : {
              classes: [
                {
                  id: "one",
                  subject: "Recovered class",
                  day: "Mon",
                  start: "09:00",
                  end: "10:00",
                },
              ],
              warnings: [],
            },
      ),
    });
  });
  await page.goto("/");
  await page
    .getByLabel("Upload timetable image")
    .setInputFiles("tests/fixtures/timetable-sample.jpg");
  await expect(
    page.getByRole("alert").filter({ hasText: "Reader unavailable" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Recovered class", exact: true }),
  ).toBeVisible();
});

for (const mode of ["temporary", "unsaved"]) {
  test(`save feedback explains ${mode} storage and recovers`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate((mode) => {
      const original = Storage.prototype.setItem;
      window.restoreStorage = () => {
        Storage.prototype.setItem = original;
      };
      Storage.prototype.setItem = function (key, value) {
        if (this === localStorage || mode === "unsaved")
          throw new Error("Storage blocked");
        return original.call(this, key, value);
      };
    }, mode);
    await page
      .getByRole("button", { name: "Try a sample", exact: true })
      .click();
    await expect(
      page.getByText(
        mode === "temporary"
          ? /Saved for this tab only/
          : /Changes are not saved/,
      ),
    ).toBeVisible();
    await page.evaluate(() => window.restoreStorage());
    await page.getByRole("button", { name: "Retry saving" }).click();
    await expect(
      page.getByText("Saved in this browser", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Edit Calculus II", exact: true }),
    ).toBeVisible();
  });
}

test("reset describes and clears the saved schedule and wallpaper settings", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("deletes your saved schedule");
    expect(dialog.message()).toContain("resets all wallpaper settings");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Upload image" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("timetable_classes_v1")),
    ),
  ).toEqual([]);
});

test("restoring saved data does not require writable storage", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage is read-only");
    };
  });
  await page.reload();
  await expect(
    page.getByText("Previous schedule restored.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved in this browser", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Calculus II", exact: true })
    .click();
  await expect(page.getByText(/Changes are not saved/)).toBeVisible();
});
