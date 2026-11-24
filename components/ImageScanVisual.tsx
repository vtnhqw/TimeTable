"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useWebsiteTheme } from "./WebsiteTheme";

/** A gently moving particle portrait of the actual upload, contained in its image bounds. */
export function ImageScanVisual({ src }: { src?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(1.35);
  const reducedMotion = useReducedMotion();
  const { theme } = useWebsiteTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !src) return;
    let disposed = false;
    let frame = 0;
    let lastFrame = -Infinity;
    let pixels: Uint8ClampedArray | undefined;
    let columns = 0;
    let rows = 0;
    const image = new Image();
    const draw = (time: number) => {
      if (disposed || !pixels) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const clock = reducedMotion ? 0 : time / 1000;
      const sweep = reducedMotion
        ? 0.48
        : (Math.sin(clock * 0.65 - Math.PI / 2) + 1) / 2;
      const cellX = width / columns;
      const cellY = height / rows;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const index = (row * columns + col) * 4;
          const luminance =
            (pixels[index] * 0.2126 +
              pixels[index + 1] * 0.7152 +
              pixels[index + 2] * 0.0722) /
            255;
          const ink = (1 - luminance) * (pixels[index + 3] / 255);
          const band = Math.max(0, 1 - Math.abs(row / rows - sweep) * 7);
          const wave = reducedMotion
            ? 0
            : Math.sin(col * 0.22 + row * 0.14 + clock * 1.2);
          const radius = Math.max(
            0.45,
            Math.min(cellX, cellY) * (0.13 + ink * 0.23 + band * 0.08),
          );
          context.fillStyle =
            theme === "dark"
              ? `rgba(${Math.round(155 + band * 65)}, ${Math.round(178 + band * 50)}, 255, ${0.2 + ink * 0.6 + band * 0.2})`
              : `rgba(${Math.round(65 + band * 40)}, ${Math.round(100 - band * 20)}, 210, ${0.15 + ink * 0.65 + band * 0.2})`;
          context.beginPath();
          context.arc(
            (col + 0.5) * cellX + wave * 0.75,
            (row + 0.5) * cellY + wave * 1.3,
            radius,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }
    };
    const tick = (time: number) => {
      if (disposed || document.hidden || reducedMotion) return;
      if (time - lastFrame >= 32) {
        draw(time);
        lastFrame = time;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      draw(performance.now());
      if (!document.hidden && !reducedMotion)
        frame = requestAnimationFrame(tick);
    };
    image.onload = () => {
      if (disposed) return;
      const aspect = image.naturalWidth / image.naturalHeight;
      setRatio(aspect);
      columns = Math.max(12, Math.round(68 * Math.min(1, aspect)));
      rows = Math.max(12, Math.round(68 * Math.min(1, 1 / aspect)));
      const sample = document.createElement("canvas");
      sample.width = columns;
      sample.height = rows;
      const sampleContext = sample.getContext("2d");
      if (!sampleContext) return;
      sampleContext.drawImage(image, 0, 0, columns, rows);
      pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      start();
    };
    image.src = src;
    const observer = new ResizeObserver(start);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", start);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", start);
      image.onload = null;
      image.src = "";
    };
  }, [src, reducedMotion, theme]);

  return (
    <div
      className="image-scan-visual"
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <div className="scan-aura" aria-hidden="true" />
      <div
        className="scan-document"
        style={{
          aspectRatio: ratio,
          width: `min(85%, 340px, calc(var(--scan-max-height) * ${ratio}))`,
        }}
      >
        {src && (
          <img
            src={src}
            alt="Timetable being scanned"
            className="scan-source"
          />
        )}
        <canvas ref={canvasRef} className="scan-particles" aria-hidden="true" />
        <div className="scan-sweep" aria-hidden="true" />
        <span className="scan-corner top-left" aria-hidden="true" />
        <span className="scan-corner top-right" aria-hidden="true" />
        <span className="scan-corner bottom-left" aria-hidden="true" />
        <span className="scan-corner bottom-right" aria-hidden="true" />
      </div>
    </div>
  );
}
