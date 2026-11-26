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
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { loadStep, saveStep } from "@/lib/navigation";
import { SAMPLE_CLASSES } from "@/lib/initialData";
import { extractTimetableFromImage } from "@/lib/extraction/client";
import {
  loadClassesFromStorage,
  saveClassesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  type SaveStatus,
} from "@/lib/storage";

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
  const [restored, setRestored] = useState(false);
  const [classSave, setClassSave] = useState<SaveStatus | null>(null);
  const [settingsSave, setSettingsSave] = useState<SaveStatus | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [settings, setSettings] = useState<WallpaperSettings>(DEFAULT_SETTINGS);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("Initializing…");
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore saved schedule on load
  useEffect(() => {
    const savedClasses = loadClassesFromStorage(setClassSave);
    const savedSettings = loadSettingsFromStorage(setSettingsSave);

    if (savedClasses && savedClasses.length > 0) {
      setClasses(savedClasses);
      setRestored(true);
    }
    setCurrentStep(loadStep(Boolean(savedClasses?.length)));

    if (savedSettings) {
      const next = { ...DEFAULT_SETTINGS, ...savedSettings };
      setSettings(next);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveStep(currentStep);
  }, [currentStep, isLoaded]);

  // Save changes in this browser
  const handleUpdateClasses = (newClasses: ClassEntry[]) => {
    setRestored(false);
    setClasses(newClasses);
    setClassSave(saveClassesToStorage(newClasses));
  };

  const handleUpdateSettings = (newSettings: WallpaperSettings) => {
    setRestored(false);
    setSettings(newSettings);
    setSettingsSave(saveSettingsToStorage(newSettings));
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
    setRetryFile(file);
    setExtractionError(null);
    setManualEntry(false);
    setWarnings([]);
    setRestored(false);
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
      setExtractionError(
        error instanceof Error
          ? error.message
          : "The image could not be processed. Try another image or add your classes manually.",
      );
      setPendingFile(null);
      setCurrentStep("review");
    }
  };

  const handleSkipToManual = () => {
    if (
      classes.length > 0 &&
      !confirm(
        "Start a blank schedule? This replaces your saved classes. Cancel to keep your schedule.",
      )
    )
      return;
    setSourceFile(null);
    handleUpdateClasses([]);
    setWarnings([]);
    setExtractionError(null);
    setRetryFile(null);
    setRestored(false);
    setManualEntry(true);
    setCurrentStep("review");
  };

  const handleUseSampleData = () => {
    if (
      classes.length > 0 &&
      !confirm(
        "Replace your saved classes with the sample schedule? Cancel to keep your schedule.",
      )
    )
      return;
    setExtractionError(null);
    setRetryFile(null);
    setManualEntry(false);
    setRestored(false);
    setSourceFile(null);
    handleUpdateClasses(SAMPLE_CLASSES);
    setWarnings([]);
    setCurrentStep("review");
  };

  const handleReset = () => {
    if (
      confirm(
        "Start over? This deletes your saved schedule and resets all wallpaper settings in this browser. This cannot be undone.",
      )
    ) {
      requestId.current++;
      extraction.current?.abort();
      setSourceFile(null);
      setPendingFile(null);
      handleUpdateClasses([]);
      handleUpdateSettings(DEFAULT_SETTINGS);
      setWarnings([]);
      setExtractionError(null);
      setRetryFile(null);
      setManualEntry(false);
      setRestored(false);
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

  const saveStatus = [classSave, settingsSave].includes("unsaved")
    ? "unsaved"
    : [classSave, settingsSave].includes("temporary")
      ? "temporary"
      : classSave || settingsSave;

  if (!isLoaded) {
    return <div className="loading-screen">Loading…</div>;
  }

  return (
    <div className="app-shell">
      <Navbar onReset={handleReset} hasData={classes.length > 0} />

      <main className="main-shell">
        {(restored || saveStatus) && (
          <div
            className={`save-status ${saveStatus === "saved" && !restored ? "save-status-compact" : ""}`}
            role="status"
          >
            <div>
              {restored && <span>Previous schedule restored. </span>}
              <span>
                {saveStatus === "unsaved"
                  ? "Changes are not saved. Keep this page open to avoid losing them."
                  : saveStatus === "temporary"
                    ? "Saved for this tab only. Closing it may lose your changes."
                    : "Saved in this browser"}
              </span>
            </div>
            {saveStatus && saveStatus !== "saved" && (
              <button
                className="button secondary"
                onClick={() => {
                  saveStep(currentStep);
                  setClassSave(saveClassesToStorage(classes));
                  setSettingsSave(saveSettingsToStorage(settings));
                }}
              >
                Retry saving
              </button>
            )}
          </div>
        )}
        {currentStep !== "extracting" &&
          (currentStep !== "upload" || classes.length > 0) && (
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
                classes={classes}
                settings={settings}
                onImageSelected={handleImageSelected}
                onSkipToManual={handleSkipToManual}
                onUseSampleData={handleUseSampleData}
                onKeepEditing={
                  classes.length > 0
                    ? () => setCurrentStep("review")
                    : undefined
                }
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
                extractionError={extractionError}
                manualEntry={manualEntry}
                onRetry={
                  retryFile ? () => handleImageSelected(retryFile) : undefined
                }
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
