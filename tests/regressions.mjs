import assert from "node:assert/strict";
import { normalizeTimeString, isEndTimeAfterStartTime } from "../lib/time.ts";
import { ClassEntrySchema, WallpaperSettingsSchema } from "../lib/schema.ts";
const cases = [
  [
    "empty start is invalid",
    () => assert.equal(isEndTimeAfterStartTime("", "10:00"), false),
  ],
  [
    "invalid AM hour is rejected",
    () => assert.equal(normalizeTimeString("13am"), null),
  ],
  [
    "compact OCR time is supported",
    () => assert.equal(normalizeTimeString("0930"), "09:30"),
  ],
  [
    "reversed class is rejected",
    () =>
      assert.equal(
        ClassEntrySchema.safeParse({
          id: "1",
          subject: "Math",
          day: "Mon",
          start: "11:00",
          end: "10:00",
        }).success,
        false,
      ),
  ],
  [
    "blank subject is rejected",
    () =>
      assert.equal(
        ClassEntrySchema.safeParse({
          id: "1",
          subject: "  ",
          day: "Mon",
          start: "09:00",
          end: "10:00",
        }).success,
        false,
      ),
  ],
  [
    "reversed time range is rejected",
    () =>
      assert.equal(
        WallpaperSettingsSchema.safeParse({
          device: "iphone-16-pro",
          theme: "dark",
          showRooms: true,
          showWeekend: "auto",
          timeRange: { startHour: 16, endHour: 8 },
        }).success,
        false,
      ),
  ],
];
let failures = 0;
for (const [name, run] of cases) {
  try {
    run();
    console.log("PASS", name);
  } catch (e) {
    failures++;
    console.error("FAIL", name, e.message);
  }
}
if (failures) process.exitCode = 1;

const {
  loadClassesFromStorage,
  loadSettingsFromStorage,
  saveClassesToStorage,
} = await import("../lib/storage.ts");
const memory = new Map();
globalThis.window = {};
globalThis.sessionStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
memory.set("timetable_classes_v1", JSON.stringify([{ subject: "Broken" }]));
assert.equal(loadClassesFromStorage(), null);
memory.set("timetable_settings_v1", JSON.stringify({ device: "unknown" }));
assert.equal(loadSettingsFromStorage(), null);
memory.set("timetable_settings_v1", JSON.stringify({ theme: "light" }));
assert.deepEqual(loadSettingsFromStorage(), { theme: "light" });
const validClass = {
  id: "valid",
  subject: "Math",
  day: "Mon",
  start: "09:00",
  end: "10:00",
};
saveClassesToStorage([validClass]);
assert.deepEqual(loadClassesFromStorage(), [validClass]);
memory.set("timetable_classes_v1", "broken JSON");
const originalWarn = console.warn;
console.warn = () => {};
try {
  assert.equal(loadClassesFromStorage(), null);
} finally {
  console.warn = originalWarn;
}
delete globalThis.window;
delete globalThis.sessionStorage;
console.log("PASS corrupted sessions rejected and valid sessions restored");
