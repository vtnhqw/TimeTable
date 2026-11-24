"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ClassEntry, WallpaperSettings } from "@/lib/schema";
import { DEVICES } from "@/lib/devices";
import { THEMES } from "@/lib/themes";
import { renderWallpaper } from "@/lib/render";

export interface WallpaperCanvasHandle {
  getBlob: () => Promise<Blob | null>;
}

interface WallpaperPreviewCanvasProps {
  classes: ClassEntry[];
  settings: WallpaperSettings;
  className?: string;
  onShortenedClasses?: (ids: string[]) => void;
}

export const WallpaperPreviewCanvas = forwardRef<
  WallpaperCanvasHandle,
  WallpaperPreviewCanvasProps
>(function WallpaperPreviewCanvas(
  { classes, settings, className, onShortenedClasses },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const device = DEVICES[settings.device] || DEVICES["iphone-16-pro"];
  const theme = THEMES[settings.theme] || THEMES.dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const report = renderWallpaper(canvas, classes, settings, device, theme);
    onShortenedClasses?.(report.shortenedClassIds);
    // Fade only the on-screen canvas; exported pixels remain crisp and static.
    const animation = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? canvas.animate([{ opacity: 0.65 }, { opacity: 1 }], {
          duration: 180,
          easing: "ease-out",
        })
      : undefined;
    return () => animation?.cancel();
  }, [classes, settings, device, theme, onShortenedClasses]);

  useImperativeHandle(ref, () => ({
    getBlob: () => {
      return new Promise((resolve) => {
        if (!canvasRef.current) return resolve(null);
        canvasRef.current.toBlob((blob) => resolve(blob), "image/png");
      });
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Your weekly timetable wallpaper preview"
      className={className || "w-full h-full object-contain rounded-[38px]"}
    />
  );
});
