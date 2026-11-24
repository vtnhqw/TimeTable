import { test, expect } from "@playwright/test";
test("customer page hides setup details and remembers dark mode", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your week/ })).toBeVisible();
  await expect(page.getByText("Connect your image reader")).toHaveCount(0);
  await expect(page.getByText(/GEMINI_API_KEY|\.env.local/)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
for (const width of [320, 390, 768, 1440])
  test(`usable workflow without page overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    if (width === 390)
      await page
        .getByRole("button", { name: "Switch to dark mode", exact: true })
        .click();
    const overflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
    await expect.poll(overflow).toBe(false);
    await expect(page.locator(".phone-device").first()).toBeVisible();
    await page
      .getByRole("button", { name: "Try a sample", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: /Review/ })).toBeVisible();
    await expect.poll(overflow).toBe(false);
    await page
      .getByRole("button", { name: "Edit Calculus II", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Subject Name").fill("Mobile test class");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(
      page.getByText("Mobile test class", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue to Style" }).click();
    await expect(
      page.getByRole("heading", { name: "Make it yours." }),
    ).toBeVisible();
    await expect.poll(overflow).toBe(false);
    await page.getByRole("button", { name: "Preview Wallpaper" }).click();
    await expect(
      page.getByRole("button", { name: "Download wallpaper", exact: true }),
    ).toBeVisible();
    await expect.poll(overflow).toBe(false);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download wallpaper", exact: true })
      .click();
    expect((await download).suggestedFilename()).toMatch(/\.png$/);
  });

test("uses the system theme before a preference is saved", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("unavailable image reader leaves manual entry usable without setup instructions", async ({
  page,
}) => {
  await page.route("**/api/extract", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "Image reading is temporarily unavailable. Please try again later or add your classes manually.",
      }),
    }),
  );
  await page.goto("/");
  await page
    .getByLabel("Upload timetable image")
    .setInputFiles("tests/fixtures/timetable-sample.jpg");
  await expect(
    page.getByText(/Image reading is temporarily unavailable/),
  ).toBeVisible();
  await expect(page.getByText(/GEMINI_API_KEY|\.env.local/)).toHaveCount(0);
  await page.getByRole("button", { name: "Add Class", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

for (const outcome of ["failure", "empty"]) {
  test(`replacement ${outcome} preserves existing schedule`, async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Try a sample", exact: true })
      .click();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.route("**/api/extract", (route) =>
      route.fulfill({
        status: outcome === "failure" ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          outcome === "failure"
            ? { error: "Reader unavailable" }
            : { classes: [], warnings: ["No classes found"] },
        ),
      }),
    );
    await page
      .getByLabel("Upload timetable image")
      .setInputFiles("tests/fixtures/timetable-sample.jpg");
    await expect(page.getByRole("heading", { name: /Review/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit Calculus II", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Edit Calculus II", exact: true }),
    ).toBeVisible();
  });
}

test("undo restores deletions without losing later edits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Calculus II", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Class", exact: true }).click();
  await page.getByLabel("Subject Name").fill("New class");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add Class", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit New class", exact: true })
    .click();
  await page.getByLabel("Subject Name").fill("Edited class");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await page
    .getByRole("button", { name: "Delete Edited class", exact: true })
    .click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Calculus II", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Edited class", exact: true }),
  ).toBeVisible();
});

test("schedule and styles survive closing the original tab", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await page.getByRole("button", { name: "Continue to Style" }).click();
  await page.getByRole("button", { name: /Light Mode/ }).click();
  const fresh = await context.newPage();
  await page.close();
  await fresh.goto("/");
  await expect(
    fresh.getByRole("button", { name: "Edit Calculus II", exact: true }),
  ).toBeVisible();
  await fresh.getByRole("button", { name: "Continue to Style" }).click();
  await expect(
    fresh.getByRole("button", { name: /Light Mode/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("conflicts are flagged and both overlapping classes are visible in the wallpaper", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "timetable_classes_v1",
      JSON.stringify([
        {
          id: "a",
          subject: "Math",
          day: "Mon",
          start: "09:00",
          end: "10:00",
          color: "#ff0000",
        },
        {
          id: "b",
          subject: "Art",
          day: "Mon",
          start: "09:00",
          end: "10:00",
          color: "#0000ff",
        },
      ]),
    );
  });
  await page.reload();
  await expect(page.getByText(/2 classes overlap in time/)).toBeVisible();
  await page.getByRole("button", { name: "Continue to Style" }).click();
  const pixels = await page.locator("canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    // Sample inside both halves of Monday's 09:00–10:00 block, below its text.
    const y = Math.round(
      canvas.height * 0.27 + canvas.height * 0.032 + canvas.height * 0.05,
    );
    return [0.16, 0.24].map((x) =>
      Array.from(
        ctx.getImageData(Math.round(canvas.width * x), y, 1, 1).data,
      ).slice(0, 3),
    );
  });
  expect(pixels).toEqual([
    [255, 0, 0],
    [0, 0, 255],
  ]);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Delete Art", exact: true }).click();
  await expect(page.getByText(/classes overlap in time/)).toHaveCount(0);
});
