import type { Day } from "./schema.ts";

export const DAYS_ORDER: Day[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];
export const WEEKDAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/**
 * Converts "HH:mm" to minutes from 00:00.
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes from 00:00 to "HH:mm".
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Formats "09:00" to "9:00 AM" or "9:00" depending on 12h / 24h.
 */
export function formatHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Validates whether end time is strictly after start time.
 */
export function isEndTimeAfterStartTime(start: string, end: string): boolean {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
  return (
    valid.test(start) &&
    valid.test(end) &&
    timeToMinutes(end) > timeToMinutes(start)
  );
}

/**
 * Normalizes user/OCR time string to HH:mm (24h).
 * Examples: "9", "9am", "9:30", "0930", "1:30pm"
 */
export function normalizeTimeString(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();

  // Format: 1:30pm or 11am or 9:00am
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3] === "pm";
    if (hour < 1 || hour > 12) return null;

    if (hour === 12) {
      hour = isPm ? 12 : 0;
    } else if (isPm) {
      hour += 12;
    }
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }
  }

  // Format: 09:30 or 9:30 or 9.30
  const colonMatch = trimmed.match(/^(\d{1,2})[:.](\d{2})$/);
  if (colonMatch) {
    const hour = parseInt(colonMatch[1], 10);
    const minute = parseInt(colonMatch[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }
  }

  if (/^\d{4}$/.test(trimmed)) {
    return normalizeTimeString(`${trimmed.slice(0, 2)}:${trimmed.slice(2)}`);
  }

  // Format: just an hour number like "9" or "14"
  const singleHourMatch = trimmed.match(/^(\d{1,2})$/);
  if (singleHourMatch) {
    const hour = parseInt(singleHourMatch[1], 10);
    if (hour >= 0 && hour <= 23) {
      return `${hour.toString().padStart(2, "0")}:00`;
    }
  }

  return null;
}
