"use client";

import { useRouter } from "next/navigation";
import { useOnboardingWizard, ONBOARDING_STEPS } from "@/hooks/useOnboardingWizard";
import StepIndustry from "./StepIndustry";
import StepChannels from "./StepChannels";
import StepVoice from "./StepVoice";

function ProgressHeader({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {ONBOARDING_STEPS.map((label, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border transition-colors ${
                  isDone
                    ? "bg-[#00C9A7] border-[#00C9A7] text-[#070B0F]"
                    : isActive
                      ? "border-[#00C9A7] text-[#00C9A7]"
                      : "border-[#1F2D3D] text-[#64748B]"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-mono hidden sm:inline ${
                  isActive ? "text-[#F1F5F9] font-semibold" : "text-[#64748B]"
                }`}
              >
                {label}
              </span>
            </div>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div
                className={`h-px flex-1 transition-colors ${isDone ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingWizard() {
  const router = useRouter();
  const wizard = useOnboardingWizard();

  async function handleNext() {
    if (wizard.step === 0) {
      await wizard.goNextFromIndustry();
    } else if (wizard.step === 1) {
      await wizard.goNextFromChannels();
    } else {
      const ok = await wizard.submitVoice();
      if (ok) router.push("/onboarding/done");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Tell us who you write for</h1>
        <p className="mt-2 text-[#94A3B8]">This shapes every idea and draft the pipeline generates.</p>
      </div>

      <ProgressHeader step={wizard.step} />

      {wizard.step === 0 && <StepIndustry wizard={wizard} />}
      {wizard.step === 1 && <StepChannels wizard={wizard} />}
      {wizard.step === 2 && <StepVoice wizard={wizard} />}

      {wizard.error && (
        <div className="mt-6 rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-4 py-3 text-sm text-[#ff6b4a]">
          {wizard.error}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        {wizard.step > 0 && (
          <button
            type="button"
            onClick={wizard.goBack}
            disabled={wizard.saving}
            className="rounded-lg border border-[#1F2D3D] px-5 py-3 font-semibold text-[#94A3B8] hover:border-[#00C9A7] hover:text-[#F1F5F9] disabled:opacity-50"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={wizard.saving}
          className="rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90 disabled:opacity-50"
        >
          {wizard.saving ? "Saving…" : wizard.step === 2 ? "Finish setup" : "Continue"}
        </button>
      </div>
    </div>
  );
}
