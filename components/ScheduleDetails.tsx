"use client";

import { ChevronDown } from "lucide-react";
import { getSubjectLabel } from "@/lib/labels";
import type { ClassEntry, WallpaperSettings } from "@/lib/schema";
import { DAYS_ORDER } from "@/lib/time";

export function ScheduleDetails({
  classes,
  shortenedIds,
  settings,
}: {
  classes: ClassEntry[];
  shortenedIds: string[];
  settings: WallpaperSettings;
}) {
  const sorted = [...classes].sort(
    (a, b) =>
      DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day) ||
      a.start.localeCompare(b.start),
  );
  return (
    <details
      className="schedule-details"
      open={shortenedIds.length > 0 || undefined}
    >
      <summary>
        <span>Full schedule details</span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      {shortenedIds.length > 0 && (
        <p className="schedule-fit-notice" role="status">
          {shortenedIds.length}{" "}
          {shortenedIds.length === 1 ? "label is" : "labels are"} shortened in
          this wallpaper because the blocks are too small. Full names and rooms
          are shown below. Try Short or Initials above, or choose a smaller text
          size.
        </p>
      )}
      <ol>
        {sorted.map((entry) => (
          <li key={entry.id}>
            <span className="schedule-detail-time">
              {entry.day} · {entry.start}–{entry.end}
            </span>
            <strong>
              {getSubjectLabel(entry.subject, {
                ...settings,
                nameStyle: "full",
              })}
            </strong>
            {entry.room && (
              <span className="schedule-detail-room">{entry.room}</span>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}
