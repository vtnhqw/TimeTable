"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Save,
  Clock,
  MapPin,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClassEntry, Day } from "@/lib/schema";
import { DAYS_ORDER, isEndTimeAfterStartTime } from "@/lib/time";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ClassEntry) => void;
  initialEntry?: ClassEntry | null;
}

export function AddClassModal({
  isOpen,
  onClose,
  onSave,
  initialEntry,
}: AddClassModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(
      () =>
        dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus(),
      0,
    );
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input, select",
      );
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [isOpen, onClose]);
  const [subject, setSubject] = useState("");
  const [day, setDay] = useState<Day>("Mon");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:30");
  const [room, setRoom] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEntry) {
      setSubject(initialEntry.subject);
      setDay(initialEntry.day);
      setStart(initialEntry.start);
      setEnd(initialEntry.end);
      setRoom(initialEntry.room || "");
    } else {
      setSubject("");
      setDay("Mon");
      setStart("09:00");
      setEnd("10:30");
      setRoom("");
    }
    setError(null);
  }, [initialEntry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    if (!isEndTimeAfterStartTime(start, end)) {
      setError("End time must be after start time.");
      return;
    }

    onSave({
      id: initialEntry ? initialEntry.id : crypto.randomUUID(),
      subject: subject.trim(),
      day,
      start,
      end,
      room: room.trim() ? room.trim() : undefined,
      color: initialEntry?.color,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-dialog-title"
            className="dialog-card relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-700/20 text-blue-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3
                  id="class-dialog-title"
                  className="text-lg font-bold text-stone-800"
                >
                  {initialEntry ? "Edit Class" : "Add New Class"}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close class editor"
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="text-xs font-semibold text-stone-600"
                >
                  Subject Name
                </label>
                <input
                  id="subject"
                  required
                  maxLength={120}
                  type="text"
                  placeholder="e.g. Calculus II, Physics Lab"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-700 transition-colors"
                  autoFocus
                />
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-600">
                  Day of Week
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={day === d}
                      onClick={() => setDay(d)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        day === d
                          ? "bg-blue-800 text-white shadow-sm"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200/80 hover:text-stone-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="start-time"
                    className="text-xs font-semibold text-stone-600 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                    <span>Start Time</span>
                  </label>
                  <input
                    id="start-time"
                    required
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-sm focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="end-time"
                    className="text-xs font-semibold text-stone-600 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                    <span>End Time</span>
                  </label>
                  <input
                    id="end-time"
                    required
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-sm focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              {/* Room (Optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="room"
                  className="text-xs font-semibold text-stone-600 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  <span>Room or Location (Optional)</span>
                </label>
                <input
                  type="text"
                  id="room"
                  maxLength={80}
                  placeholder="e.g. B204, Lab 3, Hall A"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-700"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-800 text-xs font-medium hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {initialEntry ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{initialEntry ? "Save Changes" : "Add Class"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
