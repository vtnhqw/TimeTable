import { test, expect } from "@playwright/test";

const subjects = [
  {
    id: "web-1",
    subject: "Web Programming (CSEB4123)",
    day: "Mon",
    start: "09:00",
    end: "11:00",
    room: "TA-4-213",
  },
  {
    id: "web-2",
    subject: "Web Programming (CSEB4123)",
    day: "Wed",
    start: "09:00",
    end: "11:00",
    room: "BN-4-015",
  },
  {
    id: "windows",
    subject: "Windows Programming",
    day: "Tue",
    start: "10:00",
    end: "12:00",
    room: "Lab 2",
  },
];
async function enterPreview(page) {
  await page.goto("/");
  await page.evaluate(
    (classes) =>
      localStorage.setItem("timetable_classes_v1", JSON.stringify(classes)),
    subjects,
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Back to review", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to Style" }).click();
  await page.getByRole("button", { name: "Preview Wallpaper" }).click();
  await page.getByText("Adjust wallpaper", { exact: true }).click();
}

test("preview options update wallpaper pixels, share state with Style and persist", async ({
  page,
}) => {
  await enterPreview(page);
  await expect(page.getByRole("radio", { name: /^Full / })).toBeChecked();
  await expect(
    page.getByRole("switch", { name: /Show locations/ }),
  ).toBeChecked();
  const pixels = () =>
    page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  const full = await pixels();
  await page.getByRole("radio", { name: /^Short / }).check();
  await expect.poll(pixels).not.toBe(full);
  const short = await pixels();
  await page.getByRole("radio", { name: /^Initials / }).check();
  await expect(
    page.getByText(/Some subjects use the same label: WP/),
  ).toBeVisible();
  await expect.poll(pixels).not.toBe(short);
  const initials = await pixels();
  await page.getByRole("switch", { name: /Show locations/ }).uncheck();
  await expect.poll(pixels).not.toBe(initials);
  await page.getByLabel("Text size", { exact: false }).selectOption("large");
  await page.getByText("Customize names", { exact: true }).click();
  const custom = page
    .locator(".custom-label-subject")
    .filter({ has: page.locator("legend", { hasText: "Web Programming" }) });
  await custom.getByLabel("Initials", { exact: true }).fill("WEB");
  await expect(page.getByText(/Some subjects use the same label/)).toHaveCount(
    0,
  );
  await custom.getByLabel("Short name", { exact: true }).fill("Web Dev");
  const selected = await pixels();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download wallpaper", exact: true })
    .click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(
    `data:image/png;base64,${Buffer.concat(chunks).toString("base64")}`,
  ).toBe(selected);
  await page.getByRole("button", { name: "Back to style & colors" }).click();
  await expect(page.getByRole("radio", { name: /^Initials / })).toBeChecked();
  await expect(
    page.getByRole("switch", { name: /Show locations/ }),
  ).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole("radio", { name: /^Initials / })).toBeChecked();
  await page.getByText("Customize names", { exact: true }).click();
  await expect(
    page.getByLabel("Initials", { exact: true }).first(),
  ).toHaveValue("WEB");
  await expect(page.getByLabel("Text size", { exact: false })).toHaveValue(
    "large",
  );
  await page
    .getByRole("button", { name: "Reset labels for Web Programming" })
    .click();
  await expect(
    page.getByLabel("Initials", { exact: true }).first(),
  ).toHaveValue("");
  await expect(
    page.getByText(/Some subjects use the same label: WP/),
  ).toBeVisible();
});

test("course code display is opt-in and controls fit a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await enterPreview(page);
  await page.getByText("More options", { exact: true }).click();
  await expect(
    page.getByRole("switch", { name: /Show course codes/ }),
  ).not.toBeChecked();
  const before = await page
    .locator("canvas")
    .evaluate((canvas) => canvas.toDataURL());
  await page.getByRole("switch", { name: /Show course codes/ }).check();
  await expect
    .poll(() => page.locator("canvas").evaluate((canvas) => canvas.toDataURL()))
    .not.toBe(before);
  await page.getByText("Customize names", { exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.getByRole("radio", { name: /^Short / }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /^Initials / })).toBeChecked();
});

test("subjects differing only by course code remain identifiable when customizing", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "timetable_classes_v1",
      JSON.stringify([
        {
          id: "one",
          subject: "Math (MATH101)",
          day: "Mon",
          start: "09:00",
          end: "10:00",
        },
        {
          id: "two",
          subject: "Math (MATH102)",
          day: "Tue",
          start: "09:00",
          end: "10:00",
        },
      ]),
    ),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Back to review", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to Style" }).click();
  await page.getByText("Customize names", { exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Math (MATH101)", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Math (MATH102)", exact: true }),
  ).toBeVisible();
});
