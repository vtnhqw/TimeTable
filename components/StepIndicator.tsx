"use client";
import {
  Upload,
  ListChecks,
  Palette,
  Download,
  Check,
  ChevronRight,
} from "lucide-react";
export type WizardStep =
  "upload" | "extracting" | "review" | "style" | "preview";
const steps = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "review", label: "Review", icon: ListChecks },
  { id: "style", label: "Style", icon: Palette },
  { id: "preview", label: "Download", icon: Download },
] as const;
export function StepIndicator({
  currentStep,
  onStepClick,
  canNavigateTo,
}: {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  canNavigateTo: (step: WizardStep) => boolean;
}) {
  const active = steps.findIndex(
    (s) => s.id === (currentStep === "extracting" ? "upload" : currentStep),
  );
  return (
    <nav className="stepper" aria-label="Wallpaper creation steps">
      {steps.map((step, i) => {
        const Icon = i < active ? Check : step.icon;
        return (
          <div className="step-item" key={step.id}>
            <button
              className={`step-button ${i === active ? "active" : ""} ${i < active ? "complete" : ""}`}
              aria-current={i === active ? "step" : undefined}
              disabled={!canNavigateTo(step.id)}
              onClick={() => onStepClick(step.id)}
            >
              <span className="step-icon">
                <Icon size={17} />
              </span>
              <span>
                <small>STEP 0{i + 1}</small>
                <strong>{step.label}</strong>
              </span>
            </button>
            {i < 3 && <ChevronRight className="step-chevron" size={16} />}
          </div>
        );
      })}
    </nav>
  );
}
