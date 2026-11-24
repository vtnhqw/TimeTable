import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutClasses } from "../lib/layout.ts";
const entry = (id, start, end, day = "Mon") => ({
  id,
  subject: id,
  start,
  end,
  day,
});
test("identical and nested sessions occupy distinct lanes", () => {
  const result = layoutClasses([
    entry("a", "09:00", "12:00"),
    entry("b", "09:00", "12:00"),
    entry("c", "10:00", "11:00"),
  ]);
  assert.deepEqual(
    result.map((x) => [x.lane, x.lanes]),
    [
      [0, 3],
      [1, 3],
      [2, 3],
    ],
  );
});
test("chained conflicts reuse lanes and adjacent sessions stay full width", () => {
  const result = layoutClasses([
    entry("a", "09:00", "10:00"),
    entry("b", "09:30", "10:30"),
    entry("c", "10:00", "11:00"),
    entry("d", "11:00", "12:00"),
    entry("e", "09:00", "10:00", "Tue"),
  ]);
  assert.deepEqual(
    result.map((x) => [x.entry.id, x.lane, x.lanes]),
    [
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 2],
      ["d", 0, 1],
      ["e", 0, 1],
    ],
  );
});
test("layout is deterministic for unsorted input and does not mutate it", () => {
  const input = [entry("b", "09:30", "11:00"), entry("a", "09:00", "10:00")];
  assert.deepEqual(
    layoutClasses(input).map((x) => x.entry.id),
    ["a", "b"],
  );
  assert.equal(input[0].id, "b");
});
