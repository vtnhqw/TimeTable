import type { ClassEntry } from "./schema.ts";
import { DAYS_ORDER } from "./time.ts";

interface ClassLayout {
  entry: ClassEntry;
  lane: number;
  lanes: number;
}

/** Assign disjoint horizontal lanes to connected groups of overlapping sessions. */
export function layoutClasses(classes: ClassEntry[]): ClassLayout[] {
  const result: ClassLayout[] = [];
  for (const day of DAYS_ORDER) {
    const entries = classes
      .filter((entry) => entry.day === day)
      .sort(
        (a, b) =>
          a.start.localeCompare(b.start) ||
          b.end.localeCompare(a.end) ||
          a.id.localeCompare(b.id),
      );
    let group: ClassLayout[] = [];
    let laneEnds: string[] = [];
    let groupEnd = "";
    const flush = () => {
      group.forEach((item) => {
        item.lanes = laneEnds.length;
      });
      result.push(...group);
      group = [];
      laneEnds = [];
      groupEnd = "";
    };
    for (const entry of entries) {
      if (entry.start >= groupEnd) flush();
      let lane = laneEnds.findIndex((end) => end <= entry.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = entry.end;
      group.push({ entry, lane, lanes: 1 });
      if (entry.end > groupEnd) groupEnd = entry.end;
    }
    flush();
  }
  return result;
}
