"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClassEntry, Day } from "@/lib/schema";
import { getSubjectColor } from "@/lib/colors";
import { DAYS_ORDER } from "@/lib/time";
import { layoutClasses } from "@/lib/layout";
import { AddClassModal } from "./AddClassModal";

interface ReviewStepProps {
  classes: ClassEntry[];
  warnings: string[];
  extractionError?: string | null;
  manualEntry?: boolean;
  onRetry?: () => void;
  sourceImage?: string;
  onUpdateClasses: (classes: ClassEntry[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ReviewStep({
  classes,
  warnings,
  extractionError,
  manualEntry,
  onRetry,
  sourceImage,
  onUpdateClasses,
  onBack,
  onContinue,
}: ReviewStepProps) {
  const [editingEntry, setEditingEntry] = useState<ClassEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<Day | "All">(
    "All",
  );

  const [deletedEntries, setDeletedEntries] = useState<ClassEntry[]>([]);

  const handleDelete = (id: string) => {
    const entry = classes.find((item) => item.id === id);
    if (entry) setDeletedEntries((previous) => [...previous, entry]);
    onUpdateClasses(classes.filter((c) => c.id !== id));
  };

  const handleSaveEntry = (entry: ClassEntry) => {
    const existingIndex = classes.findIndex((c) => c.id === entry.id);
    if (existingIndex >= 0) {
      const updated = [...classes];
      updated[existingIndex] = entry;
      onUpdateClasses(updated);
    } else {
      onUpdateClasses([...classes, entry]);
    }
  };

  // Sort classes by day order, then by start time
  const sortedClasses = [...classes].sort((a, b) => {
    const dayDiff = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.start.localeCompare(b.start);
  });

  const conflictingIds = new Set(
    layoutClasses(classes)
      .filter((item) => item.lanes > 1)
      .map((item) => item.entry.id),
  );

  const filteredClasses =
    selectedDayFilter === "All"
      ? sortedClasses
      : sortedClasses.filter((c) => c.day === selectedDayFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-800">
            Review Your Schedule
          </h2>
          <p className="text-xs text-stone-500">
            {classes.length} class{classes.length === 1 ? "" : "es"} in your
            week. You can edit any details or add missing rows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="button primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {deletedEntries.length > 0 && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 text-sm"
        >
          <span>
            Deleted {deletedEntries[deletedEntries.length - 1].subject}.
          </span>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              const entry = deletedEntries[deletedEntries.length - 1];
              if (!classes.some((item) => item.id === entry.id))
                onUpdateClasses([...classes, entry]);
              setDeletedEntries((previous) => previous.slice(0, -1));
              setSelectedDayFilter("All");
            }}
          >
            Undo
          </button>
        </div>
      )}

      {sourceImage && (
        <details className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
          <summary className="cursor-pointer text-sm font-semibold">
            <span className="inline-flex items-center gap-2">
              <ImageIcon size={16} /> Original timetable
            </span>
          </summary>
          {/* Local preview of the original image. */}
          <img
            src={sourceImage}
            alt="Original uploaded timetable for checking extracted classes"
            className="mt-4 max-h-[600px] w-full object-contain rounded-lg"
          />
        </details>
      )}
      {extractionError && (
        <div className="extraction-error" role="alert">
          <strong>We couldn’t read your timetable</strong>
          <p>{extractionError}</p>
          {classes.length > 0 && <p>Your existing schedule has been kept.</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {onRetry && (
              <button className="button secondary" onClick={onRetry}>
                Try again
              </button>
            )}
            <button className="button secondary" onClick={onBack}>
              Choose another image
            </button>
          </div>
        </div>
      )}
      {manualEntry && classes.length === 0 && (
        <p className="entry-help">
          Start with one class. Choose its day and time, then add the rest of
          your week.
        </p>
      )}
      {/* Warnings Banner if any */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Review these details</span>
          </div>
          {Array.from(new Set(warnings)).map((w, i) => (
            <p key={i} className="text-stone-600 text-xs pl-6">
              {w}
            </p>
          ))}
          <button className="button secondary mt-3" onClick={onBack}>
            Choose another image
          </button>
        </div>
      )}

      {conflictingIds.size > 0 && (
        <p
          role="status"
          className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800"
        >
          {conflictingIds.size} classes overlap in time. Check their days and
          times; overlapping classes appear side by side on your wallpaper.
        </p>
      )}

      {/* Day Filter Pills */}
      <div className="filter-pills flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          aria-pressed={selectedDayFilter === "All"}
          onClick={() => setSelectedDayFilter("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedDayFilter === "All"
              ? "bg-slate-200 text-slate-900 font-bold"
              : "bg-stone-100 text-stone-500 hover:text-stone-800"
          }`}
        >
          All Days ({classes.length})
        </button>
        {DAYS_ORDER.map((d) => {
          const count = classes.filter((c) => c.day === d).length;
          if (
            count === 0 &&
            d !== "Mon" &&
            d !== "Tue" &&
            d !== "Wed" &&
            d !== "Thu" &&
            d !== "Fri"
          ) {
            return null; // hide empty weekends by default
          }
          return (
            <button
              key={d}
              aria-pressed={selectedDayFilter === d}
              onClick={() => setSelectedDayFilter(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                selectedDayFilter === d
                  ? "bg-blue-800 text-white font-bold"
                  : "bg-stone-100 text-stone-500 hover:text-stone-800"
              }`}
            >
              <span>{d}</span>
              <span className="text-xs opacity-75 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Class List */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-stone-200 rounded-3xl space-y-3 bg-white">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-stone-500">
                No classes{" "}
                {selectedDayFilter === "All"
                  ? "added yet"
                  : `on ${selectedDayFilter}`}
                .
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingEntry(null);
                  setIsModalOpen(true);
                }}
                className="text-xs text-blue-700 hover:underline"
              >
                {selectedDayFilter === "All"
                  ? "+ Add your first class"
                  : `Add a class on ${{ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }[selectedDayFilter]}`}
              </button>
            </div>
          ) : (
            filteredClasses.map((item) => (
              <motion.div
                key={item.id}
                layout
                transition={{
                  layout: { type: "spring", stiffness: 450, damping: 38 },
                  opacity: { duration: 0.18 },
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="class-row p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-200 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2.5 h-10 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        item.color ||
                        getSubjectColor(
                          item.subject,
                          "light",
                          Array.from(
                            new Set(classes.map((c) => c.subject)),
                          ).indexOf(item.subject),
                        ),
                    }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-stone-800 truncate">
                      {item.subject}
                    </h4>
                    {conflictingIds.has(item.id) && (
                      <span className="text-xs text-amber-800">
                        Time conflict
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-0.5">
                      <span className="font-semibold text-blue-700">
                        {item.day}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-stone-600">
                        <Clock className="w-3 h-3 text-stone-500" />
                        {item.start} – {item.end}
                      </span>
                      {item.room && (
                        <span className="flex items-center gap-1 text-stone-500">
                          <MapPin className="w-3 h-3 text-stone-500" />
                          {item.room}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingEntry(item);
                      setIsModalOpen(true);
                    }}
                    className="class-action p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-800 transition-colors"
                    title="Edit Class"
                    aria-label={`Edit ${item.subject}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="class-action delete-action p-2 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-400 transition-colors"
                    title="Delete Class"
                    aria-label={`Delete ${item.subject}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Nav Actions */}
      <div className="step-actions">
        <button type="button" onClick={onBack} className="button secondary">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={classes.length === 0}
          onClick={onContinue}
          className="button primary"
        >
          <span>Continue to Style</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal dialog */}
      <AddClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
        initialDay={selectedDayFilter === "All" ? "Mon" : selectedDayFilter}
      />
    </motion.div>
  );
}
