"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { StepIndicator, WizardStep } from "@/components/StepIndicator";
import { UploadStep } from "@/components/UploadStep";
import { ExtractingStep } from "@/components/ExtractingStep";
import { ReviewStep } from "@/components/ReviewStep";
import { StyleStep } from "@/components/StyleStep";
import { PreviewStep } from "@/components/PreviewStep";
import { ClassEntry, WallpaperSettings } from "@/lib/schema";
import { DEFAULT_DEVICE } from "@/lib/devices";
import { SAMPLE_CLASSES } from "@/lib/initialData";
import { extractTimetableFromImage } from "@/lib/extraction/client";
import {
  loadClassesFromStorage,
  saveClassesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from "@/lib/storage";

const DEFAULT_SETTINGS: WallpaperSettings = {
  device: DEFAULT_DEVICE,
  theme: "dark",
  showRooms: true,
  showWeekend: "auto",
  timeRange: "auto",
};

export default function Home() {
  const requestId = useRef(0);
  const extraction = useRef<AbortController | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceImage, setSourceImage] = useState<string | undefined>();
  useEffect(() => {
    if (!sourceFile) {
      setSourceImage(undefined);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setSourceImage(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);
  useEffect(
    () => () => {
      extraction.current?.abort();
      requestId.current++;
    },
    [],
  );
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload");
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [settings, setSettings] = useState<WallpaperSettings>(DEFAULT_SETTINGS);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("Initializing…");
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore saved schedule on load
  useEffect(() => {
    const savedClasses = loadClassesFromStorage();
    const savedSettings = loadSettingsFromStorage();

    if (savedClasses && savedClasses.length > 0) {
      setClasses(savedClasses);
      setCurrentStep("review");
    }

    if (savedSettings) {
      setSettings((prev) => ({ ...prev, ...savedSettings }));
    }

    setIsLoaded(true);
  }, []);

  // Save changes in this browser
  const handleUpdateClasses = (newClasses: ClassEntry[]) => {
    setClasses(newClasses);
    saveClassesToStorage(newClasses);
  };

  const handleUpdateSettings = (newSettings: WallpaperSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const handleUpdateSubjectColor = (subject: string, color: string) => {
    const updated = classes.map((c) =>
      c.subject.trim() === subject.trim() ? { ...c, color } : c,
    );
    handleUpdateClasses(updated);
  };

  // Image upload & OCR
  const handleImageSelected = async (file: File) => {
    extraction.current?.abort();
    extraction.current = new AbortController();
    const id = ++requestId.current;
    setPendingFile(file);
    setCurrentStep("extracting");
    setOcrProgress(5);
    setOcrStatus("Preparing your image…");

    try {
      const result = await extractTimetableFromImage(
        file,
        (pct, status) => {
          if (id !== requestId.current) return;
          setOcrProgress((previous) => Math.max(previous, pct));
          setOcrStatus(status);
        },
        extraction.current.signal,
      );

      if (id !== requestId.current) return;
      if (result.classes.length > 0) {
        handleUpdateClasses(result.classes);
        setSourceFile(file);
        setWarnings(result.warnings);
      } else {
        if (classes.length === 0) setSourceFile(file);
        setWarnings([
          ...result.warnings,
          classes.length > 0
            ? "No replacement classes were found. Your existing schedule has been kept."
            : "No classes were found. Try another image or add classes manually.",
        ]);
      }
      setPendingFile(null);
      setCurrentStep("review");
    } catch (error) {
      if (id !== requestId.current) return;
      if (classes.length === 0) setSourceFile(file);
      setWarnings([
        error instanceof Error
          ? error.message
          : "The image could not be processed. Try another image or add your classes manually.",
      ]);
      setPendingFile(null);
      setCurrentStep("review");
    }
  };

  const handleSkipToManual = () => {
    setSourceFile(null);
    handleUpdateClasses([]);
    setWarnings([
      "You can now add your classes manually using the 'Add Class' button.",
    ]);
    setCurrentStep("review");
  };

  const handleUseSampleData = () => {
    setSourceFile(null);
    handleUpdateClasses(SAMPLE_CLASSES);
    setWarnings([]);
    setCurrentStep("review");
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to start over? Any unsaved edits will be cleared.",
      )
    ) {
      requestId.current++;
      extraction.current?.abort();
      setSourceFile(null);
      setPendingFile(null);
      handleUpdateClasses([]);
      handleUpdateSettings(DEFAULT_SETTINGS);
      setWarnings([]);
      setCurrentStep("upload");
    }
  };

  const canNavigateTo = (targetStep: WizardStep): boolean => {
    if (currentStep === "extracting") return false;
    if (targetStep === "upload") return true;
    if (targetStep === "review")
      return currentStep !== "upload" || classes.length > 0;
    if (targetStep === "style" || targetStep === "preview")
      return classes.length > 0;
    return false;
  };

  if (!isLoaded) {
    return <div className="loading-screen">Loading…</div>;
  }

  return (
    <div className="app-shell">
      <Navbar onReset={handleReset} hasData={classes.length > 0} />

      <main className="main-shell">
        {currentStep !== "extracting" && currentStep !== "upload" && (
          <StepIndicator
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
            canNavigateTo={canNavigateTo}
          />
        )}

        <div
          className={`workspace ${currentStep === "upload" ? "welcome-workspace" : currentStep === "extracting" ? "scanning-workspace" : "editor-workspace"}`}
        >
          <AnimatePresence mode="wait">
            {currentStep === "upload" && (
              <UploadStep
                key="upload"
                onImageSelected={handleImageSelected}
                onSkipToManual={handleSkipToManual}
                onUseSampleData={handleUseSampleData}
              />
            )}

            {currentStep === "extracting" && (
              <ExtractingStep
                key="extracting"
                file={pendingFile}
                progress={ocrProgress}
                statusText={ocrStatus}
                onCancel={() => {
                  requestId.current++;
                  extraction.current?.abort();
                  setPendingFile(null);
                  setCurrentStep("upload");
                }}
              />
            )}

            {currentStep === "review" && (
              <ReviewStep
                key="review"
                classes={classes}
                warnings={warnings}
                sourceImage={sourceImage}
                onUpdateClasses={handleUpdateClasses}
                onBack={() => setCurrentStep("upload")}
                onContinue={() => setCurrentStep("style")}
              />
            )}

            {currentStep === "style" && (
              <StyleStep
                key="style"
                classes={classes}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onUpdateSubjectColor={handleUpdateSubjectColor}
                onBack={() => setCurrentStep("review")}
                onContinue={() => setCurrentStep("preview")}
              />
            )}

            {currentStep === "preview" && (
              <PreviewStep
                key="preview"
                classes={classes}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onBack={() => setCurrentStep("style")}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="site-footer">
        <p>Timetable</p>
        <span>Made for your everyday.</span>
      </footer>
    </div>
  );
}
