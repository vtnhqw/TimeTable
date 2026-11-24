"use client";
import { useRef, useState } from "react";
import { Upload, ArrowUpRight, PenLine, Play, ImagePlus } from "lucide-react";
import { WallpaperPreviewCanvas } from "./WallpaperPreviewCanvas";
import { PhonePreview } from "./PhonePreview";
import { useWebsiteTheme } from "./WebsiteTheme";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/extraction/upload";
import { SAMPLE_CLASSES } from "@/lib/initialData";
export function UploadStep({
  onImageSelected,
  onSkipToManual,
  onUseSampleData,
}: {
  onImageSelected: (file: File) => void;
  onSkipToManual: () => void;
  onUseSampleData: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useWebsiteTheme();
  function handleFile(file: File) {
    const message = validateImageFile(file);
    setError(message ?? "");
    if (!message) onImageSelected(file);
  }
  return (
    <div className="upload-layout">
      <section className="upload-content">
        <span className="hero-kicker">YOUR WEEK, ON YOUR LOCK SCREEN</span>
        <h1>
          Your week.
          <br />
          <span>One glance.</span>
        </h1>
        <p className="hero-description">
          From a busy timetable to a beautifully simple wallpaper.
        </p>
        <div
          className={`upload-zone ${drag ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={input}
            type="file"
            accept={IMAGE_ACCEPT}
            aria-label="Upload timetable image"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleFile(file);
            }}
          />
          <span className="upload-icon">
            <ImagePlus size={25} />
          </span>
          <h2>Drop your timetable</h2>
          <button
            className="button primary"
            onClick={() => input.current?.click()}
          >
            <Upload size={17} />
            Upload image
            <ArrowUpRight size={16} />
          </button>
          <small>PNG, JPG, WebP & more · up to 20 MB</small>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="start-options">
          <button onClick={onSkipToManual}>
            <PenLine size={17} />
            Add manually
          </button>
          <button onClick={onUseSampleData}>
            <Play size={16} />
            Try a sample
          </button>
        </div>
        <p className="privacy-note">Images are processed by Google Gemini.</p>
      </section>
      <aside className="showcase" aria-label="iPhone lock screen preview">
        <div className="showcase-heading">
          <span>MADE FOR YOUR EVERYDAY</span>
          <h2>A place for every class.</h2>
        </div>
        <div className="phone-stage">
          <PhonePreview theme={theme}>
            <WallpaperPreviewCanvas
              classes={SAMPLE_CLASSES}
              settings={{
                device: "iphone-16-pro",
                theme,
                showRooms: true,
                showWeekend: "auto",
                timeRange: "auto",
              }}
              className="block w-full h-auto"
            />
          </PhonePreview>
        </div>
        <span className="preview-caption">
          <span /> A little more organized.
        </span>
      </aside>
    </div>
  );
}
