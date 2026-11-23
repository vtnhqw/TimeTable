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
}

export const WallpaperPreviewCanvas = forwardRef<
  WallpaperCanvasHandle,
  WallpaperPreviewCanvasProps
>(function WallpaperPreviewCanvas({ classes, settings, className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const device = DEVICES[settings.device] || DEVICES["iphone-16-pro"];
  const theme = THEMES[settings.theme] || THEMES.dark;

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderWallpaper(canvas, classes, settings, device, theme);
  };

  useEffect(() => {
    render();
  }, [classes, settings, device, theme]);

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
