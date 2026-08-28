import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { Sparkles, MessageSquare, ArrowLeft, Loader2, ShieldAlert, Target, Lightbulb } from "lucide-react";

const textareaClass =
  "w-full rounded-xl bg-[#070B0F] border border-[#1F2D3D] p-3.5 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-xs leading-relaxed";

export default function StepBrandInterview({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-6 sm:p-8 space-y-6 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <MessageSquare className="w-5 h-5 text-[#00C9A7]" />
          <h2 className="text-xl font-bold text-[#F1F5F9]">2-Minute Brand Interview</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8]">
          Answer these 3 quick questions. Our AI Copilot will turn your answers into sharp, high-converting editorial guardrails.
        </p>
      </div>

      {wizard.error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {wizard.error}
        </div>
      )}

      <div className="space-y-4">
        {/* Question 1 */}
        <div className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 space-y-2">
          <label className="block text-xs font-semibold text-[#F1F5F9] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>1. What common myth or bad advice in your industry do you disagree with?</span>
          </label>
          <textarea
            rows={2}
            value={wizard.mythAnswer}
            onChange={(e) => wizard.setMythAnswer(e.target.value)}
            placeholder="e.g. Charging hourly instead of upfront flat-rate quotes, or thinking AI can write copy without human review."
            className={textareaClass}
          />
        </div>

        {/* Question 2 */}
        <div className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 space-y-2">
          <label className="block text-xs font-semibold text-[#F1F5F9] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00C9A7]" />
            <span>2. What is your #1 differentiator (why do clients hire you)?</span>
          </label>
          <textarea
            rows={2}
            value={wizard.differentiatorAnswer}
            onChange={(e) => wizard.setDifferentiatorAnswer(e.target.value)}
            placeholder="e.g. We guarantee 45-minute emergency dispatch, or our deterministic schema validation makes errors impossible."
            className={textareaClass}
          />
        </div>

        {/* Question 3 */}
        <div className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 space-y-2">
          <label className="block text-xs font-semibold text-[#F1F5F9] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>3. What topics or claims should we STRICTLY AVOID?</span>
          </label>
          <textarea
            rows={2}
            value={wizard.avoidAnswer}
            onChange={(e) => wizard.setAvoidAnswer(e.target.value)}
            placeholder="e.g. Never quote specific dollar pricing, don't mention cheap DIY repairs, or no unverified customer metrics."
            className={textareaClass}
          />
        </div>
      </div>

      {/* Navigation & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-[#1F2D3D]/60">
        <button
          type="button"
          onClick={wizard.goBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={wizard.generateDirectives}
          disabled={wizard.isGeneratingDirectives}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] font-semibold text-sm transition-colors shadow-lg shadow-[#00C9A7]/20 disabled:opacity-50"
        >
          {wizard.isGeneratingDirectives ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Brand Rules…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate My Brand Directives</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
