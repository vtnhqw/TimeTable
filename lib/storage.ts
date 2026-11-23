import { ClassEntrySchema, WallpaperSettingsSchema } from "./schema.ts";
import type { ClassEntry, WallpaperSettings } from "./schema.ts";

const STORAGE_KEY_CLASSES = "timetable_classes_v1";
const STORAGE_KEY_SETTINGS = "timetable_settings_v1";

export function loadClassesFromStorage(): ClassEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CLASSES);
    if (!raw) return null;
    const result = ClassEntrySchema.array().safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch (err) {
    console.warn("Failed to load classes from sessionStorage", err);
    return null;
  }
}

export function saveClassesToStorage(classes: ClassEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  } catch (err) {
    console.warn("Failed to save classes to sessionStorage", err);
  }
}

export function loadSettingsFromStorage(): Partial<WallpaperSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return null;
    const result = WallpaperSettingsSchema.partial().safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch (err) {
    console.warn("Failed to load settings from sessionStorage", err);
    return null;
  }
}

export function saveSettingsToStorage(settings: WallpaperSettings): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save settings to sessionStorage", err);
  }
}
