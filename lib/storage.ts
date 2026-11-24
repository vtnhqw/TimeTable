import { z } from "zod";
import { ClassEntrySchema, WallpaperSettingsSchema } from "./schema.ts";
import type { ClassEntry, WallpaperSettings } from "./schema.ts";

const STORAGE_KEY_CLASSES = "timetable_classes_v1";
const STORAGE_KEY_SETTINGS = "timetable_settings_v1";

function save(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  try {
    localStorage.setItem(key, raw);
    // Retire the legacy copy so it cannot restore an obsolete schedule.
    try {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}_fallback`);
    } catch {
      /* Storage may be blocked. */
    }
    return;
  } catch {
    /* Fall back to saving for this tab when persistence is blocked. */
  }
  try {
    sessionStorage.setItem(`${key}_fallback`, raw);
  } catch {
    /* Keep the in-memory editor usable. */
  }
}

function load<T>(key: string, schema: z.ZodType<T>): T | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    const fallback = sessionStorage.getItem(`${key}_fallback`);
    if (fallback !== null) {
      const parsed = schema.safeParse(JSON.parse(fallback));
      if (parsed.success) {
        save(key, parsed.data);
        return parsed.data;
      }
    }
  } catch {
    /* Ignore unavailable or corrupt fallback storage. */
  }
  try {
    raw = localStorage.getItem(key);
  } catch {
    /* Try this tab's storage. */
  }
  if (raw !== null) {
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
  try {
    raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    save(key, parsed.data);
    return parsed.data;
  } catch {
    return null;
  }
}

export function loadClassesFromStorage(): ClassEntry[] | null {
  return load(STORAGE_KEY_CLASSES, ClassEntrySchema.array());
}
export function saveClassesToStorage(classes: ClassEntry[]): void {
  save(STORAGE_KEY_CLASSES, classes);
}
export function loadSettingsFromStorage(): Partial<WallpaperSettings> | null {
  return load(STORAGE_KEY_SETTINGS, WallpaperSettingsSchema.partial());
}
export function saveSettingsToStorage(settings: WallpaperSettings): void {
  save(STORAGE_KEY_SETTINGS, settings);
}
