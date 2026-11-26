"use client";

import { useId } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import type { ClassEntry, WallpaperSettings } from "@/lib/schema";
import { automaticLabels, getSubjectLabel } from "@/lib/labels";

export function WallpaperDetailsControls({
  classes,
  settings,
  onChange,
}: {
  classes: ClassEntry[];
  settings: WallpaperSettings;
  onChange: (settings: WallpaperSettings) => void;
}) {
  const id = useId();
  const subjects = Array.from(
    new Set(classes.map((entry) => entry.subject.trim())),
  );
  const labelGroups = new Map<string, string[]>();
  for (const subject of subjects) {
    const label = getSubjectLabel(subject, settings).toLocaleLowerCase();
    labelGroups.set(label, [...(labelGroups.get(label) ?? []), subject]);
  }
  const duplicates = Array.from(labelGroups.values()).filter(
    (group) => group.length > 1,
  );
  const overrides = settings.subjectLabelOverrides ?? {};
  function updateLabel(
    subject: string,
    kind: "short" | "initials",
    value: string,
  ) {
    const previous = Object.prototype.hasOwnProperty.call(overrides, subject)
      ? overrides[subject]
      : {};
    onChange({
      ...settings,
      subjectLabelOverrides: {
        ...overrides,
        [subject]: { ...previous, [kind]: value },
      },
    });
  }
  return (
    <section className="wallpaper-controls" aria-labelledby={`${id}-heading`}>
      <div className="wallpaper-controls-heading">
        <h3 id={`${id}-heading`}>Wallpaper details</h3>
        <p>Choose what appears on your wallpaper.</p>
      </div>
      <fieldset className="label-style-fieldset">
        <legend>Class names</legend>
        <div className="label-style-options">
          {(
            [
              ["full", "Full", "Web Programming"],
              ["short", "Short", "Web Prog"],
              ["initials", "Initials", "WP"],
            ] as const
          ).map(([value, label, example]) => (
            <label key={value} className="label-style-option">
              <input
                type="radio"
                name={`${id}-names`}
                value={value}
                checked={(settings.nameStyle ?? "full") === value}
                onChange={() => onChange({ ...settings, nameStyle: value })}
              />
              <span>
                <strong>{label}</strong>
                <small>{example}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="detail-control-row" htmlFor={`${id}-rooms`}>
        <span>
          Show locations<small>Rooms and places on the wallpaper</small>
        </span>
        <input
          id={`${id}-rooms`}
          type="checkbox"
          role="switch"
          className="detail-switch"
          checked={settings.showRooms}
          onChange={(event) =>
            onChange({ ...settings, showRooms: event.target.checked })
          }
        />
      </label>
      <label className="detail-control-row" htmlFor={`${id}-size`}>
        <span>
          Text size<small>One consistent size across classes</small>
        </span>
        <span className="detail-select">
          <select
            id={`${id}-size`}
            value={settings.textSize ?? "standard"}
            onChange={(event) =>
              onChange({
                ...settings,
                textSize: event.target.value as WallpaperSettings["textSize"],
              })
            }
          >
            <option value="small">Small</option>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </span>
      </label>
      <details className="label-options-details">
        <summary>
          More options
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <label className="detail-control-row" htmlFor={`${id}-codes`}>
          <span>
            Show course codes<small>For example, CSEB4123</small>
          </span>
          <input
            id={`${id}-codes`}
            type="checkbox"
            role="switch"
            className="detail-switch"
            checked={settings.showCourseCodes ?? false}
            onChange={(event) =>
              onChange({ ...settings, showCourseCodes: event.target.checked })
            }
          />
        </label>
      </details>
      {duplicates.length > 0 && (
        <p role="status" className="duplicate-label-notice">
          Some subjects use the same label:{" "}
          {duplicates
            .map((group) => getSubjectLabel(group[0], settings))
            .join(", ")}
          .{" "}
          {settings.nameStyle === "full"
            ? "Show course codes, or choose Short or Initials and customize their names below."
            : "Customize their names below to tell them apart."}
        </p>
      )}
      <details className="label-options-details">
        <summary>
          Customize names
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <p className="custom-label-help">
          Your names apply to every session of the same subject. Clear a field
          to use its suggestion.
        </p>
        <div className="custom-label-list">
          {subjects.map((subject, index) => {
            const automatic = automaticLabels(subject);
            const ambiguous = subjects.some(
              (other) =>
                other !== subject &&
                automaticLabels(other).full.toLocaleLowerCase() ===
                  automatic.full.toLocaleLowerCase(),
            );
            const editorName = ambiguous ? subject : automatic.full;
            const custom = Object.prototype.hasOwnProperty.call(
              overrides,
              subject,
            )
              ? overrides[subject]
              : undefined;
            return (
              <fieldset key={subject} className="custom-label-subject">
                <legend>{editorName}</legend>
                <div className="custom-label-fields">
                  <label htmlFor={`${id}-${index}-short`}>
                    Short name
                    <input
                      id={`${id}-${index}-short`}
                      type="text"
                      maxLength={40}
                      value={custom?.short ?? ""}
                      placeholder={automatic.short}
                      onChange={(event) =>
                        updateLabel(subject, "short", event.target.value)
                      }
                    />
                  </label>
                  <label htmlFor={`${id}-${index}-initials`}>
                    Initials
                    <input
                      id={`${id}-${index}-initials`}
                      type="text"
                      maxLength={8}
                      value={custom?.initials ?? ""}
                      placeholder={automatic.initials}
                      onChange={(event) =>
                        updateLabel(subject, "initials", event.target.value)
                      }
                    />
                  </label>
                </div>
                {(custom?.short || custom?.initials) && (
                  <button
                    type="button"
                    className="label-reset"
                    aria-label={`Reset labels for ${editorName}`}
                    onClick={() => {
                      const updated = { ...overrides };
                      delete updated[subject];
                      onChange({ ...settings, subjectLabelOverrides: updated });
                    }}
                  >
                    <RotateCcw size={13} />
                    Use automatic names
                  </button>
                )}
              </fieldset>
            );
          })}
        </div>
      </details>
    </section>
  );
}
