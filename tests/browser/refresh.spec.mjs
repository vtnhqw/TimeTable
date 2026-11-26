import { test, expect } from "@playwright/test";

test("refresh keeps the current step and selected text size", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await page.getByRole("button", { name: "Continue to Style" }).click();
  await page.getByLabel("Text size", { exact: false }).selectOption("small");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make it yours." }),
  ).toBeVisible();
  await expect(page.getByLabel("Text size", { exact: false })).toHaveValue(
    "small",
  );
  await page.getByRole("button", { name: "Preview Wallpaper" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Download wallpaper", exact: true }),
  ).toBeVisible();
  await page.getByText("Adjust wallpaper", { exact: true }).click();
  await expect(page.getByLabel("Text size", { exact: false })).toHaveValue(
    "small",
  );
  await page.getByRole("button", { name: /Upload/ }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Back to review", exact: true }),
  ).toBeVisible();
});

test("invalid or unavailable saved steps recover safely", async ({ page }) => {
  await page.goto("/");
  for (const step of ["preview", "style", "extracting", "invalid"]) {
    await page.evaluate(
      (step) => sessionStorage.setItem("timetable_step_v1", step),
      step,
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Upload image" }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Add manually", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Add Class", exact: true }),
  ).toBeVisible();
});
