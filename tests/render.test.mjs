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

test("normal subject words stay whole when a slightly smaller font fits", () => {
  const { calls } = render("Web Programming", "TA-4-213");
  assert.ok(
    calls.some((call) => call.text === "Programming"),
    calls.map((call) => call.text).join("|"),
  );
  assert.ok(!calls.some((call) => call.text === "g"));
});
