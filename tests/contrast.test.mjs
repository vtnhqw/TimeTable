import { test } from "node:test";
import assert from "node:assert/strict";
import { getContrastingTextColor } from "../lib/colors.ts";
import { THEMES } from "../lib/themes.ts";
test("small class labels choose at least 4.5:1 contrast on every preset color", () => {
  for (const color of [
    ...THEMES.dark.subjectColors,
    ...THEMES.light.subjectColors,
  ]) {
    const rgb = color
      .slice(1)
      .match(/../g)
      .map((channel) => parseInt(channel, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    const contrast =
      getContrastingTextColor(color) === "black"
        ? (luminance + 0.05) / 0.05
        : 1.05 / (luminance + 0.05);
    assert.ok(contrast >= 4.5, `${color}: ${contrast.toFixed(2)}:1`);
  }
});
