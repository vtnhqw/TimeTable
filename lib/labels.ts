import type { WallpaperSettings } from "./schema.ts";

const shortWords: Record<string, string> = {
  programming: "Prog",
  requirements: "Req",
  engineering: "Eng",
  computer: "Comp",
  computing: "Comp",
  introduction: "Intro",
  systems: "Sys",
  object: "Obj",
  mathematics: "Math",
  statistics: "Stats",
  technology: "Tech",
  information: "Info",
};
const wordCharacters = new RegExp("[\\p{L}\\p{N}]+", "u");
const connectors = new Set(["a", "an", "the", "and", "of", "to", "for", "in"]);

export function splitSubjectCode(subject: string): {
  name: string;
  code?: string;
} {
  const trimmed = subject.trim();
  const match = trimmed.match(/^(.*?)\s*\(([A-Z]{2,}[ -]?\d{2,}[A-Z0-9-]*)\)$/);
  return match && match[1].trim()
    ? { name: match[1].trim(), code: match[2] }
    : { name: trimmed };
}

export function automaticLabels(subject: string) {
  const { name: full } = splitSubjectCode(subject);
  const words = full
    .split(/\s+/)
    .filter((word) => !connectors.has(word.toLowerCase()));
  const meaningful = words.length ? words : full.split(/\s+/);
  const initials = meaningful
    .map((word) => {
      const letters = word.match(wordCharacters)?.[0] ?? word;
      return Array.from(letters)[0] ?? "";
    })
    .join("")
    .toLocaleUpperCase();
  return {
    full,
    short: meaningful
      .map((word) =>
        Object.prototype.hasOwnProperty.call(shortWords, word.toLowerCase())
          ? shortWords[word.toLowerCase()]
          : word,
      )
      .join(" "),
    initials,
  };
}

export function getSubjectLabel(
  subject: string,
  settings: Partial<WallpaperSettings>,
) {
  const style = settings.nameStyle ?? "full";
  const labels = automaticLabels(subject);
  const key = subject.trim();
  const overrides = settings.subjectLabelOverrides ?? {};
  const custom = Object.prototype.hasOwnProperty.call(overrides, key)
    ? overrides[key]
    : undefined;
  const label =
    style === "full" ? labels.full : custom?.[style]?.trim() || labels[style];
  const { code } = splitSubjectCode(subject);
  return settings.showCourseCodes && code ? `${label} (${code})` : label;
}
