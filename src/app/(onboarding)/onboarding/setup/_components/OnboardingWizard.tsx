"use client";

import { useOnboardingWizard, ONBOARDING_STEPS } from "@/hooks/useOnboardingWizard";
import StepCompanySnapshot from "./StepCompanySnapshot";
import StepLinkedInVoice from "./StepLinkedInVoice";
import StepBrandInterview from "./StepBrandInterview";
import StepConfirmDirectives from "./StepConfirmDirectives";
import { Sparkles } from "lucide-react";

function ProgressHeader({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8 sm:mb-10">
      {ONBOARDING_STEPS.map((label, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all ${
                  isDone
                    ? "bg-[#00C9A7] border-[#00C9A7] text-[#070B0F] shadow-sm shadow-[#00C9A7]/30"
                    : isActive
                      ? "border-[#00C9A7] text-[#00C9A7] ring-2 ring-[#00C9A7]/20 bg-[#00C9A7]/5"
                      : "border-[#1F2D3D] text-[#64748B] bg-[#070B0F]"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-mono hidden md:inline ${
                  isActive ? "text-[#F1F5F9] font-bold" : isDone ? "text-[#94A3B8]" : "text-[#64748B]"
                }`}
              >
                {label}
              </span>
            </div>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors ${isDone ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingWizard() {
  const wizard = useOnboardingWizard();

  return (
    <div className="min-h-screen bg-[#070B0F] text-[#F1F5F9] px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-[#00C9A7] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Minions AI Autonomous Content Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F1F5F9] tracking-tight">
            Let&apos;s personalize your content engine
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl">
            In under 2 minutes, we&apos;ll connect your channels, calibrate your writing style, and launch your first executive draft.
          </p>
        </div>

        {/* Progress Tracker */}
        <ProgressHeader step={wizard.step} />

        {/* Step Container */}
        <div>
          {wizard.step === 0 && <StepLinkedInVoice wizard={wizard} />}
          {wizard.step === 1 && <StepCompanySnapshot wizard={wizard} />}
          {wizard.step === 2 && <StepBrandInterview wizard={wizard} />}
          {wizard.step === 3 && <StepConfirmDirectives wizard={wizard} />}
        </div>
      </div>
    </div>
  );
}
