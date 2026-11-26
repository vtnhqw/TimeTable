import { test, expect } from "@playwright/test";

test("Upload keeps the editor navigation and existing schedule available", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample", exact: true }).click();
  const nav = page.getByRole("navigation", {
    name: "Wallpaper creation steps",
  });
  await nav.getByRole("button", { name: /Upload/ }).click();
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("button", { name: /Upload/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(
    page.getByRole("heading", { name: "Update your timetable." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to review", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Calculus II", exact: true }),
  ).toBeVisible();
  for (const [step, heading] of [
    ["Style", "Make it yours."],
    ["Download", "Your week, to go."],
  ]) {
    await nav.getByRole("button", { name: /Upload/ }).click();
    await nav.getByRole("button", { name: new RegExp(step) }).click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
});
