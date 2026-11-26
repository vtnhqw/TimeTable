import { test, expect } from "@playwright/test";

test("existing schedules have clear replacement actions and a focused download page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Previous schedule restored.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Calculus II", exact: true })
    .click();
  await expect(
    page.getByText("Previous schedule restored.", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Upload/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Try a sample", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start a blank schedule", exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Start a blank schedule", exact: true })
    .click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Download/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Download wallpaper", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Text size", { exact: false }),
  ).not.toBeVisible();
  await page.getByText("Adjust wallpaper", { exact: true }).click();
  await page.getByLabel("Text size", { exact: false }).selectOption("large");
  await page
    .getByRole("button", { name: "View full screen", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "100% zoom", exact: true }),
  ).toBeVisible();
});
