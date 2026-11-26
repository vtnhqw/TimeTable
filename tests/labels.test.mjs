import { test } from "node:test";
import assert from "node:assert/strict";
import { getSubjectLabel, automaticLabels } from "../lib/labels.ts";
import { WallpaperSettingsSchema } from "../lib/schema.ts";

test("default names hide course codes without removing descriptive parentheses", () => {
  assert.equal(
    getSubjectLabel("Web Programming (CSEB4123)", {}),
    "Web Programming",
  );
  assert.equal(getSubjectLabel("Physics (Lab)", {}), "Physics (Lab)");
  assert.equal(getSubjectLabel("CSEB4123", {}), "CSEB4123");
  assert.equal(
    getSubjectLabel("Web Programming (CSEB4123)", { showCourseCodes: true }),
    "Web Programming (CSEB4123)",
  );
});
test("short names and initials are generated from meaningful words", () => {
  assert.deepEqual(automaticLabels("Web Programming (CSEB4123)"), {
    full: "Web Programming",
    short: "Web Prog",
    initials: "WP",
  });
  assert.equal(
    automaticLabels("Introduction to Social Computing").initials,
    "ISC",
  );
  assert.equal(automaticLabels("Requirements Engineering").short, "Req Eng");
  assert.equal(automaticLabels("Econometrics").short, "Econometrics");
});
test("subject-specific overrides apply without changing source names or full mode", () => {
  const subject = "Web Programming (CSEB4123)";
  const settings = {
    nameStyle: "short",
    subjectLabelOverrides: { [subject]: { short: "Web Dev", initials: "WD" } },
  };
  assert.equal(getSubjectLabel(subject, settings), "Web Dev");
  assert.equal(
    getSubjectLabel(subject, { ...settings, nameStyle: "initials" }),
    "WD",
  );
  assert.equal(
    getSubjectLabel(subject, { ...settings, nameStyle: "full" }),
    "Web Programming",
  );
  assert.equal(
    getSubjectLabel(subject, { ...settings, subjectLabelOverrides: {} }),
    "Web Prog",
  );
});
test("legacy settings get readable defaults and custom labels validate", () => {
  const legacy = {
    device: "iphone-se",
    theme: "light",
    showRooms: false,
    showWeekend: "auto",
    timeRange: "auto",
  };
  const result = WallpaperSettingsSchema.parse(legacy);
  assert.equal(result.nameStyle, "full");
  assert.equal(result.showCourseCodes, false);
  assert.equal(result.textSize, "standard");
  assert.deepEqual(result.subjectLabelOverrides, {});
  assert.equal(
    WallpaperSettingsSchema.safeParse({
      ...legacy,
      subjectLabelOverrides: { Math: { short: "x".repeat(41) } },
    }).success,
    false,
  );
});
