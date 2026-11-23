"use client";

import React from "react";
import { Loader2, CheckCircle2, Search, Cpu, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface ExtractingStepProps {
  progress: number;
  statusText: string;
  onCancel: () => void;
}

export function ExtractingStep({
  progress,
  statusText,
  onCancel,
}: ExtractingStepProps) {
  const steps = [
    { label: "Preparing your image", threshold: 15, icon: FileText },
    { label: "Sending to Gemini", threshold: 30, icon: Cpu },
    { label: "Reading all days and classes", threshold: 75, icon: Search },
    {
      label: "Checking subjects, days & times",
      threshold: 95,
      icon: CheckCircle2,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="max-w-md mx-auto py-12 px-4 text-center space-y-8"
    >
      {/* Animated Spinner Icon */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-stone-200 border-t-emerald-700"
        />
        <div className="w-16 h-16 rounded-full bg-emerald-700/10 flex items-center justify-center text-emerald-700 shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-stone-800 tracking-tight">
          Reading Your Timetable…
        </h3>
        <p className="text-xs text-stone-500" role="status">
          {statusText}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          role="progressbar"
          aria-label="Reading timetable"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden"
        >
          <motion.div
            className="bg-emerald-700 h-2.5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-stone-500 font-mono">
          <span>Reading with Gemini</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Checklist items */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 text-left space-y-3">
        {steps.map((st, i) => {
          const isDone = progress >= st.threshold;
          const isCurrent =
            progress < st.threshold &&
            (i === 0 || progress >= steps[i - 1].threshold);
          const Icon = st.icon;

          return (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isCurrent
                      ? "bg-emerald-700/20 text-emerald-700 animate-pulse"
                      : "bg-stone-100 text-slate-600"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`${
                  isDone
                    ? "text-stone-600 line-through text-stone-500"
                    : isCurrent
                      ? "text-stone-800 font-medium"
                      : "text-slate-600"
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
      <button className="button secondary" onClick={onCancel}>
        Cancel and go back
      </button>
    </motion.div>
  );
}
