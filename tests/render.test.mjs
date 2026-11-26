import { test } from "node:test";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { renderWallpaper } from "../lib/render.ts";
import { THEMES } from "../lib/themes.ts";
const device = {
  width: 1206,
  height: 2622,
  topOffsetPercent: 0.27,
  bottomOffsetPercent: 0.08,
};
const settings = {
  device: "iphone-16-pro",
  theme: "dark",
  showRooms: true,
  showCourseCodes: true,
  showWeekend: "auto",
  timeRange: { startHour: 8, endHour: 19 },
};
function render(subject, room, start = "08:00", end = "10:00") {
  const canvas = createCanvas(1, 1);
  const ctx = canvas.getContext("2d");
  const calls = [];
  const fill = ctx.fillText.bind(ctx);
  ctx.fillText = (text, x, y, ...args) => {
    calls.push({ text, x, y, width: ctx.measureText(text).width });
    fill(text, x, y, ...args);
  };
  const report = renderWallpaper(
    canvas,
    [{ id: "one", day: "Mon", subject, room, start, end }],
    settings,
    device,
    THEMES.dark,
  );
  return { calls, report, canvas };
}
test("two-hour cards use available space for full long subjects and rooms", () => {
  const { calls } = render(
    "Object Oriented Programming (CSEB3313)",
    "Infolab 2, Lvl 5, Library",
  );
  const text = calls
    .map((call) => call.text)
    .join("")
    .replace(/\s/g, "");
  assert.ok(text.includes("ObjectOrientedProgramming(CSEB3313)"), text);
  assert.ok(text.includes("Infolab2,Lvl5,Library"), text);
});
test("long room tokens are wrapped within their day column", () => {
  const { calls } = render(
    "Web Programming",
    "BM-1-020/21-Computer-Laboratory",
  );
  const texts = calls.filter(
    (call) => call.text.includes("BM") || call.text.includes("Laboratory"),
  );
  assert.ok(texts.length);
  assert.ok(
    texts.every((call) => call.x + call.width < device.width * 0.3),
    "room text extends beyond Monday",
  );
  const text = calls
    .map((call) => call.text)
    .join("")
    .replace(/\s/g, "");
  assert.ok(text.includes("BM-1-020/21-Computer-Laboratory"));
});
test("tiny classes report shortened labels instead of silently clipping content", () => {
  const { report } = render(
    "Human Computer Interaction (CISB3323)",
    "BM-1-003/004",
    "08:00",
    "08:10",
  );
  assert.deepEqual(report?.shortenedClassIds, ["one"]);
});

test("normal subject words stay whole at the standard font size", () => {
  const { calls } = render("Web Programming", "TA-4-213");
  assert.ok(
    calls.some((call) => call.text === "Programming"),
    calls.map((call) => call.text).join("|"),
  );
  assert.ok(!calls.some((call) => call.text === "g"));
});

test("class cards share the selected font size and never wrap a single leftover letter", () => {
  const canvas = createCanvas(1, 1),
    ctx = canvas.getContext("2d"),
    calls = [];
  const fill = ctx.fillText.bind(ctx);
  ctx.fillText = (text, x, y, ...args) => {
    calls.push({ text, font: ctx.font });
    fill(text, x, y, ...args);
  };
  renderWallpaper(
    canvas,
    [
      { id: "a", subject: "Math", day: "Mon", start: "08:00", end: "10:00" },
      {
        id: "b",
        subject: "Human Computer Interaction",
        day: "Tue",
        start: "08:00",
        end: "09:00",
      },
      {
        id: "c",
        subject: "Web Programming",
        day: "Wed",
        start: "08:00",
        end: "10:00",
      },
    ],
    { ...settings, textSize: "standard" },
    device,
    THEMES.dark,
  );
  const names = calls.filter((call) => /Math|Human|Web/.test(call.text));
  assert.equal(new Set(names.map((call) => call.font)).size, 1);
  assert.ok(calls.some((call) => call.text === "Programming"));
  assert.ok(!calls.some((call) => call.text === "g"));
});

test("standard full names without codes fit a typical one-hour class and room", () => {
  const canvas = createCanvas(1, 1);
  const report = renderWallpaper(
    canvas,
    [
      {
        id: "hci",
        day: "Mon",
        start: "13:00",
        end: "14:00",
        subject: "Human Computer Interaction (CISB3323)",
        room: "BM-1-018",
      },
    ],
    { ...settings, showCourseCodes: false, textSize: "standard" },
    device,
    THEMES.dark,
  );
  assert.deepEqual(report.shortenedClassIds, []);
});

for (const theme of [THEMES.dark, THEMES.light]) {
  for (const showWeekend of ["never", "always"]) {
    test(`${theme.id} shaded day cells fill to grid boundaries (${showWeekend})`, () => {
      const canvas = createCanvas(1, 1);
      renderWallpaper(
        canvas,
        [],
        { ...settings, theme: theme.id, showWeekend },
        device,
        theme,
      );
      const ctx = canvas.getContext("2d");
      const days = showWeekend === "always" ? 7 : 5;
      const left = device.width * (0.038 + 0.1 - 0.01 / 2);
      const laneWidth = (device.width * (1 - 0.038 * 2 - 0.1 + 0.01)) / days;
      const y = Math.round(device.height * 0.45);
      const pixel = (x) =>
        Array.from(ctx.getImageData(Math.round(x), y, 1, 1).data).slice(0, 3);
      for (let day = 0; day < days; day += 2) {
        for (const [edge, inside] of [
          [left + day * laneWidth + 3, left + day * laneWidth + 12],
          [left + (day + 1) * laneWidth - 3, left + (day + 1) * laneWidth - 12],
        ]) {
          const a = pixel(edge),
            b = pixel(inside);
          assert.ok(
            a.every((channel, index) => Math.abs(channel - b[index]) <= 3),
            `day ${day}: cell-edge shade ${a} differs from interior ${b}`,
          );
        }
      }
    });
  }
}

test("class cards have equal top, bottom, and side spacing", () => {
  const canvas = createCanvas(1, 1);
  renderWallpaper(
    canvas,
    [
      {
        id: "spacing",
        day: "Mon",
        subject: "A",
        start: "08:00",
        end: "10:00",
        color: "#ff0000",
      },
    ],
    settings,
    device,
    THEMES.dark,
  );
  const ctx = canvas.getContext("2d");
  const gridLeft = device.width * (0.038 + 0.1 - 0.005);
  const cellWidth = (device.width * (1 - 0.076 - 0.1 + 0.01)) / 5;
  const top = device.height * (0.27 + 0.024 + 0.008);
  const bottom =
    top + (device.height * (1 - 0.08 - 0.27 - 0.024 - 0.008) * 2) / 11;
  const isRed = (x, y) => {
    const [r, g, b] = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return r === 255 && g === 0 && b === 0;
  };
  const first = (predicate) =>
    Array.from({ length: 20 }, (_, index) => index).find(predicate);
  const leftGap = first((offset) =>
    isRed(gridLeft + offset, (top + bottom) / 2),
  );
  const topGap = first((offset) =>
    isRed(gridLeft + cellWidth / 2, top + offset),
  );
  const bottomGap = first((offset) =>
    isRed(gridLeft + cellWidth / 2, bottom - offset),
  );
  assert.ok(
    leftGap !== undefined && topGap !== undefined && bottomGap !== undefined,
  );
  assert.ok(Math.abs(leftGap - topGap) <= 1, `side ${leftGap}, top ${topGap}`);
  assert.ok(
    Math.abs(leftGap - bottomGap) <= 1,
    `side ${leftGap}, bottom ${bottomGap}`,
  );
});
