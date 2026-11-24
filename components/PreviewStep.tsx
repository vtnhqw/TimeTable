"use client";
import { useState, useRef } from "react";
import {
  Download,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Sun,
  Moon,
  Image,
} from "lucide-react";
import { ClassEntry, WallpaperSettings } from "@/lib/schema";
import { ScheduleDetails } from "./ScheduleDetails";
import { PhonePreview } from "./PhonePreview";
import { DEVICES } from "@/lib/devices";
import {
  WallpaperPreviewCanvas,
  WallpaperCanvasHandle,
} from "./WallpaperPreviewCanvas";
export function PreviewStep({
  classes,
  settings,
  onUpdateSettings,
  onBack,
}: {
  classes: ClassEntry[];
  settings: WallpaperSettings;
  onUpdateSettings: (s: WallpaperSettings) => void;
  onBack: () => void;
}) {
  const canvas = useRef<WallpaperCanvasHandle>(null);
  const [shortenedIds, setShortenedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [overlay, setOverlay] = useState(true);
  const device = DEVICES[settings.device];
  async function download() {
    if (busy || !canvas.current) return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const blob = await canvas.current.getBlob();
      if (!blob) throw new Error();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `timetable-wallpaper-${settings.device}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setSuccess(true);
    } catch {
      setError("We couldn’t create the image. Please try downloading again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="max-w-5xl mx-auto space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2>Your week, to go.</h2>
          <p className="text-stone-500">Made for your {device.name}.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="button secondary"
            aria-pressed={overlay}
            onClick={() => setOverlay(!overlay)}
          >
            {overlay ? <Eye size={16} /> : <EyeOff size={16} />} Clock preview
          </button>
          <button
            className="button secondary"
            aria-label="Switch wallpaper theme"
            onClick={() => {
              setSuccess(false);
              onUpdateSettings({
                ...settings,
                theme: settings.theme === "dark" ? "light" : "dark",
              });
            }}
          >
            {settings.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="preview-panel">
          <PhonePreview
            theme={settings.theme}
            overlay={overlay}
            legacy={settings.device === "iphone-se"}
          >
            <WallpaperPreviewCanvas
              ref={canvas}
              classes={classes}
              settings={settings}
              onShortenedClasses={setShortenedIds}
              className="block w-full h-auto"
            />
          </PhonePreview>
        </div>
        <div className="space-y-5">
          <div className="border border-stone-200 rounded-2xl p-6 space-y-5">
            <span className="feature-icon">
              <Image size={20} />
            </span>
            <div>
              <h3 className="font-semibold text-xl mb-2">
                Make it your lock screen
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Full-resolution PNG. The clock is preview-only.
              </p>
            </div>
            <dl className="text-sm space-y-3 border-y border-stone-200 py-4">
              <div className="flex justify-between">
                <dt className="text-stone-500">Device</dt>
                <dd>{device.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Resolution</dt>
                <dd>
                  {device.width} × {device.height}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Format</dt>
                <dd>PNG image</dd>
              </div>
            </dl>
            <button
              className="button primary w-full"
              disabled={busy}
              onClick={download}
            >
              {success ? <Check size={18} /> : <Download size={18} />}{" "}
              {busy
                ? "Creating your image…"
                : success
                  ? "Download again"
                  : "Download wallpaper"}
            </button>
            <div aria-live="polite">
              {success && (
                <p className="text-xs text-blue-700">
                  Your image is ready. Check your browser’s downloads.
                </p>
              )}
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
            </div>
          </div>
          <ScheduleDetails classes={classes} shortenedIds={shortenedIds} />
          <p className="text-sm text-stone-500">
            Save to Photos, then set as your lock screen.
          </p>
          <button className="button secondary w-full" onClick={onBack}>
            <ArrowLeft size={16} /> Back to style & colors
          </button>
        </div>
      </div>
    </section>
  );
}
