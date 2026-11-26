"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Palette,
  Smartphone,
  Moon,
  Sun,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { ClassEntry, WallpaperSettings, DeviceId } from "@/lib/schema";
import { DEVICES } from "@/lib/devices";
import { WallpaperPreviewCanvas } from "./WallpaperPreviewCanvas";
import { WallpaperDetailsControls } from "./WallpaperDetailsControls";
import { getSubjectLabel } from "@/lib/labels";
import { ScheduleDetails } from "./ScheduleDetails";
import { MobilePreviewSheet } from "./MobilePreviewSheet";
import { PhonePreview } from "./PhonePreview";
import { THEMES } from "@/lib/themes";
import { getSubjectColor } from "@/lib/colors";

interface StyleStepProps {
  classes: ClassEntry[];
  settings: WallpaperSettings;
  onUpdateSettings: (settings: WallpaperSettings) => void;
  onUpdateSubjectColor: (subject: string, color: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function StyleStep({
  classes,
  settings,
  onUpdateSettings,
  onUpdateSubjectColor,
  onBack,
  onContinue,
}: StyleStepProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shortenedIds, setShortenedIds] = useState<string[]>([]);
  // Extract unique subjects
  const uniqueSubjects = Array.from(
    new Set(classes.map((c) => c.subject.trim())),
  );
  const activeTheme = THEMES[settings.theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="settings-layout"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-800">
            Make it yours.
          </h2>
          <p className="text-xs text-stone-500">
            Choose a wallpaper theme, device, and colors.
          </p>
        </div>

        {/* 1. Theme Selection: Dark Mode vs Light Mode */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-700" />
            <span>Theme Preset</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            {/* Dark Mode Card */}
            <button
              type="button"
              aria-pressed={settings.theme === "dark"}
              onClick={() => onUpdateSettings({ ...settings, theme: "dark" })}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                settings.theme === "dark"
                  ? "bg-white border-blue-700 shadow-sm"
                  : "bg-white border-stone-200 hover:border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 text-blue-700 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-stone-800">
                    Dark Mode
                  </span>
                </div>
                {settings.theme === "dark" && (
                  <div className="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Dark Mode Color Swatches */}
              <div className="flex gap-1 overflow-hidden rounded-lg p-1.5 bg-white border border-stone-200">
                {THEMES.dark.subjectColors.slice(0, 6).map((col, idx) => (
                  <div
                    key={idx}
                    className="h-4 flex-1 rounded-sm"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Deep navy. Bright classes.
              </p>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              aria-pressed={settings.theme === "light"}
              onClick={() => onUpdateSettings({ ...settings, theme: "light" })}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                settings.theme === "light"
                  ? "bg-white border-blue-700 shadow-sm"
                  : "bg-white border-stone-200 hover:border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-stone-800">
                    Light Mode
                  </span>
                </div>
                {settings.theme === "light" && (
                  <div className="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Light Mode Color Swatches */}
              <div className="flex gap-1 overflow-hidden rounded-lg p-1.5 bg-slate-100 border border-stone-200">
                {THEMES.light.subjectColors.slice(0, 6).map((col, idx) => (
                  <div
                    key={idx}
                    className="h-4 flex-1 rounded-sm"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Soft background. Clear details.
              </p>
            </button>
          </div>
        </div>

        {/* 2. Device Model Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-blue-700" />
            <span>iPhone Model</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(Object.keys(DEVICES) as DeviceId[]).map((devId) => {
              const dev = DEVICES[devId];
              const isSelected = settings.device === devId;
              return (
                <button
                  key={devId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    onUpdateSettings({ ...settings, device: devId })
                  }
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? "bg-blue-800/15 border-blue-700 text-stone-800 shadow-sm"
                      : "bg-white border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-200"
                  }`}
                >
                  <div className="text-xs font-bold truncate">{dev.name}</div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    {dev.width}×{dev.height}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <WallpaperDetailsControls
          classes={classes}
          settings={settings}
          onChange={onUpdateSettings}
        />

        {/* Weekend visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Weekend Columns</span>
              </div>
              <p className="text-xs text-stone-500">
                {settings.showWeekend === "auto"
                  ? "Auto (shown if weekend class exists)"
                  : settings.showWeekend === "always"
                    ? "Always (Mon–Sun)"
                    : "Never (Mon–Fri)"}
              </p>
            </div>
            <select
              aria-label="Weekend columns"
              value={settings.showWeekend}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  showWeekend: e.target.value as "auto" | "always" | "never",
                })
              }
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-xs focus:outline-none focus:border-blue-700"
            >
              <option value="auto">Auto</option>
              <option value="never">Mon–Fri</option>
              <option value="always">Mon–Sun</option>
            </select>
          </div>
        </div>

        {/* 4. Subject Color Customization (12 curated colors) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Subject Colors ({uniqueSubjects.length})</span>
            </label>
            <span className="text-xs text-stone-500"></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {uniqueSubjects.map((subject, idx) => {
              // Find current color or default
              const existingClass = classes.find(
                (c) => c.subject.trim() === subject,
              );
              const currentColor =
                existingClass?.color ||
                getSubjectColor(subject, settings.theme, idx);

              return (
                <div
                  key={subject}
                  className="subject-color-row p-3 rounded-2xl bg-white border border-stone-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-5 h-5 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span className="text-xs font-bold text-stone-800 truncate">
                      {getSubjectLabel(subject, {
                        ...settings,
                        nameStyle: "full",
                      })}
                    </span>
                  </div>

                  {/* 12-color picker palette for this subject */}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {activeTheme.subjectColors.map((colorHex, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => onUpdateSubjectColor(subject, colorHex)}
                        aria-label={`${subject}: color ${cIdx + 1}`}
                        aria-pressed={
                          currentColor.toLowerCase() === colorHex.toLowerCase()
                        }
                        className={`color-swatch w-6 h-6 rounded-full transition-transform hover:scale-125 ${
                          currentColor.toLowerCase() === colorHex.toLowerCase()
                            ? "ring-2 ring-stone-700 scale-110"
                            : "opacity-75 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: colorHex }}
                        title={`Color ${cIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nav Actions */}
        <div className="step-actions">
          <button type="button" onClick={onBack} className="button secondary">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button type="button" onClick={onContinue} className="button primary">
            <span>Preview Wallpaper</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <div className="mobile-preview-trigger">
            <button
              className="button primary"
              onClick={() => setPreviewOpen(true)}
              aria-haspopup="dialog"
            >
              View preview
            </button>
          </div>,
          document.body,
        )}
      {previewOpen && (
        <MobilePreviewSheet onClose={() => setPreviewOpen(false)}>
          <div className="preview-panel">
            <PhonePreview
              theme={settings.theme}
              legacy={settings.device === "iphone-se"}
            >
              <WallpaperPreviewCanvas
                classes={classes}
                settings={settings}
                className="block w-full h-auto"
              />
            </PhonePreview>
          </div>
          <ScheduleDetails
            classes={classes}
            shortenedIds={shortenedIds}
            settings={settings}
          />
          <p className="entry-help">
            The clock is preview-only. Close this preview to keep adjusting your
            wallpaper.
          </p>
        </MobilePreviewSheet>
      )}
      <aside className="settings-preview">
        <div className="preview-panel">
          <PhonePreview
            theme={settings.theme}
            legacy={settings.device === "iphone-se"}
          >
            <WallpaperPreviewCanvas
              classes={classes}
              settings={settings}
              onShortenedClasses={setShortenedIds}
              className="block w-full h-auto"
            />
          </PhonePreview>
        </div>
        <p>Live preview</p>
        <ScheduleDetails
          classes={classes}
          shortenedIds={shortenedIds}
          settings={settings}
        />
      </aside>
    </motion.div>
  );
}
