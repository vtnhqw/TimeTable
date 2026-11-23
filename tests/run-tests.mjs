import assert from "node:assert/strict";

// 1. Test Time utilities
import {
  timeToMinutes,
  minutesToTime,
  normalizeTimeString,
  isEndTimeAfterStartTime,
} from "../lib/time.ts";

console.log("▶ Testing time utilities...");
assert.equal(timeToMinutes("00:00"), 0);
assert.equal(timeToMinutes("09:30"), 570);
assert.equal(timeToMinutes("14:15"), 855);
assert.equal(timeToMinutes("23:59"), 1439);

assert.equal(minutesToTime(0), "00:00");
assert.equal(minutesToTime(570), "09:30");
assert.equal(minutesToTime(855), "14:15");

assert.equal(isEndTimeAfterStartTime("09:00", "10:30"), true);
assert.equal(isEndTimeAfterStartTime("10:30", "09:00"), false);
assert.equal(isEndTimeAfterStartTime("09:00", "09:00"), false);

assert.equal(normalizeTimeString("9"), "09:00");
assert.equal(normalizeTimeString("9am"), "09:00");
assert.equal(normalizeTimeString("9:30am"), "09:30");
assert.equal(normalizeTimeString("1:30pm"), "13:30");
assert.equal(normalizeTimeString("12pm"), "12:00");
assert.equal(normalizeTimeString("12am"), "00:00");
assert.equal(normalizeTimeString("14:00"), "14:00");
assert.equal(normalizeTimeString("9.30"), "09:30");
console.log("✓ Time utilities passed!");

// 2. Test Color utilities
import {
  getContrastingTextColor,
  hexToRgba,
  getSubjectColor,
} from "../lib/colors.ts";

console.log("▶ Testing color utilities...");
assert.equal(getContrastingTextColor("#FFFFFF"), "black");
assert.equal(getContrastingTextColor("#FFFF00"), "black");
assert.equal(getContrastingTextColor("#000000"), "white");
assert.equal(getContrastingTextColor("#1E3A8A"), "white");

assert.equal(hexToRgba("#3B82F6", 0.5), "rgba(59, 130, 246, 0.5)");
assert.equal(hexToRgba("#000000", 1), "rgba(0, 0, 0, 1)");

const darkColor = getSubjectColor("Calculus II", "dark", 0);
assert.ok(darkColor.startsWith("#"));
const lightColor = getSubjectColor("Calculus II", "light", 0);
assert.ok(lightColor.startsWith("#"));
console.log("✓ Color utilities passed!");
