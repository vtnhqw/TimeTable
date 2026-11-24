"use client";

import { useEffect, useState } from "react";
import { Check, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ImageScanVisual } from "./ImageScanVisual";

interface ExtractingStepProps {
  progress: number;
  statusText: string;
  file: File | null;
  onCancel: () => void;
}

export function ExtractingStep({
  progress,
  statusText,
  file,
  onCancel,
}: ExtractingStepProps) {
  const [source, setSource] = useState<string>();
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const stage = progress >= 90 ? 2 : progress >= 30 ? 1 : 0;
  const stages = ["Prepare", "Read timetable", "Check details"];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="scanning-screen"
      aria-labelledby="scan-title"
    >
      <div className="scan-eyebrow">
        <span /> IMAGE TO TIMETABLE
      </div>
      <ImageScanVisual src={source} />
      <div className="scan-copy">
        <h2 id="scan-title">A little scan. A clearer week.</h2>
        <p>Turning your image into a schedule you can make your own.</p>
      </div>
      <div className="scan-file">
        <span className="scan-file-icon">
          <ImageIcon size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>{file?.name ?? "Your timetable"}</strong>
          <span>
            {file
              ? `${file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`} · `
              : ""}
            Image selected
          </span>
        </div>
        <Check
          size={16}
          className="scan-file-check"
          aria-label="Image selected"
        />
      </div>
      <div className="scan-activity">
        <div
          role="progressbar"
          aria-label="Reading timetable"
          aria-valuetext={statusText}
          className="scan-activity-track"
        >
          <span />
        </div>
        <p role="status" aria-live="polite">
          {statusText}
        </p>
      </div>
      <ol className="scan-stages" aria-label="Scanning stages">
        {stages.map((label, index) => (
          <li
            key={label}
            className={
              index === stage ? "current" : index < stage ? "done" : ""
            }
            aria-current={index === stage ? "step" : undefined}
          >
            <span>{index < stage ? <Check size={12} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="button secondary scan-cancel"
        aria-label="Cancel scanning"
        onClick={onCancel}
      >
        <ArrowLeft size={15} />
        Cancel scanning
      </button>
      <p className="scan-footnote">
        You’ll be able to review every class before saving.
      </p>
    </motion.section>
  );
}
