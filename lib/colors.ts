import { THEMES } from "./themes.ts";
import type { ThemeMode } from "./schema.ts";

/**
 * Returns a deterministic color for a given subject name within a chosen theme.
 */
export function getSubjectColor(
  subject: string,
  theme: ThemeMode,
  subjectIndex?: number,
): string {
  const palette = THEMES[theme].subjectColors;
  if (subjectIndex !== undefined && subjectIndex >= 0) {
    return palette[subjectIndex % palette.length];
  }

  // Hash string to index
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash << 5) - hash + subject.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Determines whether text on top of this hex background should be black or white
 * based on relative luminance (WCAG standard).
 */
export function getContrastingTextColor(hexColor: string): "white" | "black" {
  // Strip '#'
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return "white";

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Return dark text for light backgrounds, white for dark
  return L > 0.4 ? "black" : "white";
}

/**
 * Lightens or darkens a hex color with alpha.
 */
export function hexToRgba(hexColor: string, alpha: number): string {
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return `rgba(255, 255, 255, ${alpha})`;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
