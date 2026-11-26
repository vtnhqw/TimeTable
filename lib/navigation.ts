export type SavedStep = "upload" | "review" | "style" | "preview";
const KEY = "timetable_step_v1";

export function loadStep(hasClasses: boolean): SavedStep {
  try {
    const step = sessionStorage.getItem(KEY);
    if (step === "upload" || step === "review") return step;
    if (hasClasses && (step === "style" || step === "preview")) return step;
  } catch {
    // Navigation remains usable when browser storage is unavailable.
  }
  return hasClasses ? "review" : "upload";
}

export function saveStep(step: SavedStep | "extracting"): void {
  try {
    // A scan cannot resume after refresh: its uploaded file is held in memory.
    sessionStorage.setItem(KEY, step === "extracting" ? "upload" : step);
  } catch {
    // Saving the page is optional; it must never block editing.
  }
}
