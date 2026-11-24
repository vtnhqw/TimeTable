"use client";

import { ChevronDown } from "lucide-react";
import type { ClassEntry } from "@/lib/schema";
import { DAYS_ORDER } from "@/lib/time";

export function ScheduleDetails({
  classes,
  shortenedIds,
}: {
  classes: ClassEntry[];
  shortenedIds: string[];
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
          are shown below.
        </p>
      )}
      <ol>
        {sorted.map((entry) => (
          <li key={entry.id}>
            <span className="schedule-detail-time">
              {entry.day} · {entry.start}–{entry.end}
            </span>
            <strong>{entry.subject}</strong>
            {entry.room && (
              <span className="schedule-detail-room">{entry.room}</span>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}
