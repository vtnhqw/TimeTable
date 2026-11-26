import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  loadClassesFromStorage,
  saveClassesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from "../lib/storage.ts";
const entry = {
  id: "one",
  subject: "Math",
  day: "Mon",
  start: "09:00",
  end: "10:00",
};
const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
};
beforeEach(() => {
  globalThis.window = {};
  globalThis.localStorage = memoryStorage();
  globalThis.sessionStorage = memoryStorage();
});
test("schedule and settings survive a new browser session", () => {
  saveClassesToStorage([entry]);
  saveSettingsToStorage({
    device: "iphone-se",
    theme: "light",
    showRooms: false,
    showWeekend: "auto",
    timeRange: "auto",
  });
  sessionStorage.clear();
  assert.deepEqual(loadClassesFromStorage(), [entry]);
  assert.equal(loadSettingsFromStorage()?.theme, "light");
});
test("validated legacy schedule migrates once and reset is not resurrected", () => {
  sessionStorage.setItem("timetable_classes_v1", JSON.stringify([entry]));
  assert.deepEqual(loadClassesFromStorage(), [entry]);
  sessionStorage.clear();
  assert.deepEqual(loadClassesFromStorage(), [entry]);
  saveClassesToStorage([]);
  assert.deepEqual(loadClassesFromStorage(), []);
});
test("invalid persistent data cannot enter the schedule", () => {
  localStorage.setItem("timetable_classes_v1", '[{"subject":"broken"}]');
  assert.equal(loadClassesFromStorage(), null);
});
test("blocked persistent storage falls back to session storage", () => {
  globalThis.localStorage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  saveClassesToStorage([entry]);
  assert.deepEqual(loadClassesFromStorage(), [entry]);
});
test("a failed persistent write does not restore stale data over the latest edit", () => {
  saveClassesToStorage([entry]);
  localStorage.setItem = () => {
    throw Error("quota");
  };
  saveClassesToStorage([]);
  assert.deepEqual(loadClassesFromStorage(), []);
});

test("failed writes to both stores preserve the last durable schedule", () => {
  saveClassesToStorage([entry]);
  localStorage.setItem = () => {
    throw Error("quota");
  };
  sessionStorage.setItem = () => {
    throw Error("blocked");
  };
  saveClassesToStorage([]);
  assert.deepEqual(loadClassesFromStorage(), [entry]);
});

test("temporary fallback migrates when persistent storage recovers", () => {
  const setItem = localStorage.setItem;
  localStorage.setItem = () => {
    throw Error("quota");
  };
  saveClassesToStorage([entry]);
  localStorage.setItem = setItem;
  assert.deepEqual(loadClassesFromStorage(), [entry]);
  sessionStorage.clear();
  assert.deepEqual(loadClassesFromStorage(), [entry]);
});

test("legacy style settings migrate alongside the schedule", () => {
  sessionStorage.setItem(
    "timetable_settings_v1",
    JSON.stringify({ theme: "light", device: "iphone-se" }),
  );
  assert.deepEqual(loadSettingsFromStorage(), {
    theme: "light",
    device: "iphone-se",
  });
  sessionStorage.clear();
  assert.deepEqual(loadSettingsFromStorage(), {
    theme: "light",
    device: "iphone-se",
  });
});

test("save reports durable, temporary, and unsaved outcomes", () => {
  assert.equal(saveClassesToStorage([entry]), "saved");
  localStorage.setItem = () => {
    throw Error("quota");
  };
  assert.equal(saveClassesToStorage([entry]), "temporary");
  sessionStorage.setItem = () => {
    throw Error("blocked");
  };
  assert.equal(saveClassesToStorage([entry]), "unsaved");
});

test("restored durable data remains saved when new writes are blocked", () => {
  saveClassesToStorage([entry]);
  localStorage.setItem = () => {
    throw Error("quota");
  };
  sessionStorage.setItem = () => {
    throw Error("blocked");
  };
  let status;
  assert.deepEqual(
    loadClassesFromStorage((value) => {
      status = value;
    }),
    [entry],
  );
  assert.equal(status, "saved");
});
