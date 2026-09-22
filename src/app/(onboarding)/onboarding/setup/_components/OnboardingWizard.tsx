"use client";

import { useOnboardingWizard, ONBOARDING_STEPS } from "@/hooks/useOnboardingWizard";
import StepCompanySnapshot from "./StepCompanySnapshot";
import StepLinkedInVoice from "./StepLinkedInVoice";
import StepBrandInterview from "./StepBrandInterview";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

function ProgressHeader({ step }: { step: number }) {
  return (
    <div className="mb-4 flex items-center gap-1.5 sm:gap-2">
      {ONBOARDING_STEPS.map((label, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-mono font-bold border transition-all ${
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
                className={`text-sm font-mono hidden md:inline ${
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

/** Shown instead of the wizard when this workspace has already been onboarded. */
function AlreadySetUp() {
  return (
    <div className="rounded-2xl border border-[#1F2D3D] bg-[#0F1419] p-5 sm:p-6 space-y-3">
      <div className="flex items-center gap-2 text-[#00C9A7]">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9]">This workspace is already set up</h2>
      </div>
      <p className="text-sm text-[#94A3B8] leading-relaxed">
        Running onboarding again would replace its brand, voice examples, directives and posting schedule.
        Change any of those in Brand settings instead.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Link
          href="/brand"
          className="inline-flex justify-center items-center px-4 py-2 rounded-xl bg-[#00C9A7] text-[#070B0F] text-sm font-bold hover:bg-[#00A88A] transition-colors"
        >
          Open Brand settings
        </Link>
        <Link
          href="/ideas"
          className="inline-flex justify-center items-center px-4 py-2 rounded-xl border border-[#1F2D3D] text-sm font-semibold text-[#F1F5F9] hover:bg-[#161D26] transition-colors"
        >
          Go to Ideas
        </Link>
      </div>
    </div>
  );
}

export default function OnboardingWizard() {
  const wizard = useOnboardingWizard();

  return (
    <div className="min-h-screen bg-[#070B0F] px-3.5 py-4 text-[#F1F5F9] sm:px-6 sm:py-5">
      <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="text-center sm:text-left space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-[#00C9A7] text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Minions Brand Brief</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight leading-tight">
            Let&apos;s capture how you want to be known
          </h1>
          <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
            Give Minions context for relevant ideas, then choose what becomes your first draft.
          </p>
        </div>

        {wizard.alreadySetUp ? (
          <AlreadySetUp />
        ) : (
          <>
            {/* Progress Tracker */}
            <ProgressHeader step={wizard.step} />

            {/* Step Container */}
            <div>
              {wizard.step === 0 && <StepCompanySnapshot wizard={wizard} />}
              {wizard.step === 1 && <StepBrandInterview wizard={wizard} />}
              {wizard.step === 2 && <StepLinkedInVoice wizard={wizard} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
