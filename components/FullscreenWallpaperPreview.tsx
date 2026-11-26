"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import { ClassEntry, WallpaperSettings } from "@/lib/schema";
import { DEVICES } from "@/lib/devices";
import { WallpaperPreviewCanvas } from "./WallpaperPreviewCanvas";

export function FullscreenWallpaperPreview({
  classes,
  settings,
  onClose,
}: {
  classes: ClassEntry[];
  settings: WallpaperSettings;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const zoomFocus = useRef<{ x: number; y: number } | null>(null);
  const [fit, setFit] = useState(0.1);
  const [zoom, setZoom] = useState<number | null>(null);
  const device = DEVICES[settings.device];
  const scale = zoom === null ? fit : Math.max(fit, zoom);

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const resize = () =>
      setFit(
        Math.max(
          0.01,
          Math.min(
            1,
            (element.clientWidth - 32) / device.width,
            (element.clientHeight - 32) / device.height,
          ),
        ),
      );
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [device.width, device.height]);

  const changeZoom = (next: number) => {
    if (stage.current && image.current) {
      const view = stage.current.getBoundingClientRect();
      const picture = image.current.getBoundingClientRect();
      zoomFocus.current = {
        x: Math.max(
          0,
          Math.min(
            1,
            (view.left + stage.current.clientWidth / 2 - picture.left) /
              picture.width,
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            1,
            (view.top + stage.current.clientHeight / 2 - picture.top) /
              picture.height,
          ),
        ),
      };
    }
    setZoom(next);
  };

  useLayoutEffect(() => {
    const focus = zoomFocus.current;
    const view = stage.current;
    const picture = image.current;
    if (!focus || !view || !picture) return;
    const bounds = picture.getBoundingClientRect();
    const viewport = view.getBoundingClientRect();
    view.scrollTo({
      left:
        view.scrollLeft +
        bounds.left -
        viewport.left +
        focus.x * bounds.width -
        view.clientWidth / 2,
      top:
        view.scrollTop +
        bounds.top -
        viewport.top +
        focus.y * bounds.height -
        view.clientHeight / 2,
    });
    zoomFocus.current = null;
  }, [scale]);

  const fitToScreen = () => {
    zoomFocus.current = null;
    setZoom(null);
    stage.current?.scrollTo({ top: 0, left: 0 });
  };

  return createPortal(
    <dialog
      ref={dialog}
      className="wallpaper-viewer"
      aria-labelledby="wallpaper-viewer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="wallpaper-viewer-layout">
        <header className="wallpaper-viewer-header">
          <div>
            <h2 id="wallpaper-viewer-title">Wallpaper preview</h2>
            <p>
              The image you’ll download · {device.width} × {device.height}
            </p>
          </div>
          <button
            className="button secondary"
            autoFocus
            aria-label="Close full screen preview"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div
          className="wallpaper-viewer-toolbar"
          role="group"
          aria-label="Wallpaper zoom controls"
        >
          <button
            className="button secondary"
            aria-label="Zoom out"
            disabled={scale <= fit}
            onClick={() => changeZoom(Math.max(fit, scale / 1.5))}
          >
            <Minus size={18} />
          </button>
          <output aria-live="polite" aria-label="Zoom level">
            {Math.round(scale * 100)}%
          </output>
          <button
            className="button secondary"
            aria-label="Zoom in"
            disabled={scale >= 2}
            onClick={() => changeZoom(Math.min(2, scale * 1.5))}
          >
            <Plus size={18} />
          </button>
          <button className="button secondary" onClick={fitToScreen}>
            Fit to screen
          </button>
          <button className="button secondary" onClick={() => changeZoom(1)}>
            100% zoom
          </button>
        </div>
        <div
          ref={stage}
          className="wallpaper-viewer-stage"
          tabIndex={0}
          role="region"
          aria-label="Wallpaper image. Scroll to explore when zoomed in."
        >
          <div className="wallpaper-viewer-image-area">
            <div
              ref={image}
              style={{
                width: device.width * scale,
                height: device.height * scale,
              }}
            >
              <WallpaperPreviewCanvas
                classes={classes}
                settings={settings}
                className="wallpaper-viewer-canvas"
              />
            </div>
          </div>
        </div>
        <p className="wallpaper-viewer-help">
          Zoom in for details. Swipe or scroll to explore the image.
        </p>
      </div>
    </dialog>,
    document.body,
  );
}
