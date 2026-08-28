import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { Sparkles, CheckCircle2, X, ArrowLeft, Loader2, Rocket, ShieldCheck } from "lucide-react";

export default function StepConfirmDirectives({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-6 sm:p-8 space-y-6 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-[#00C9A7]" />
          <h2 className="text-xl font-bold text-[#F1F5F9]">Review Your Brand Guardrails</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8]">
          Here are the core rules our AI Writer will follow for every article, hook, and social post.
        </p>
      </div>

      {wizard.error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {wizard.error}
        </div>
      )}

      {/* Positioning Summary */}
      {wizard.positioningSummary && (
        <div className="p-4 rounded-xl border border-[#00C9A7]/30 bg-[#00C9A7]/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00C9A7]">
            <ShieldCheck className="w-4 h-4" />
            <span>Brand Strategy Summary</span>
          </div>
          <p className="text-xs text-[#F1F5F9] leading-relaxed">{wizard.positioningSummary}</p>
        </div>
      )}

      {/* Directives List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          Active Directives ({wizard.directives.length})
        </h3>

        {wizard.directives.map((dir, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/70 flex items-start justify-between gap-3 group hover:border-[#00C9A7]/40 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#00C9A7] border border-[#00C9A7]/30 uppercase">
                  {dir.category.replace("_", " ")}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">{dir.rule_key}</span>
              </div>
              <p className="text-xs text-[#F1F5F9] leading-relaxed">{dir.instruction}</p>
            </div>

            <button
              type="button"
              onClick={() => wizard.toggleDirective(idx)}
              className="p-1 rounded-lg text-[#64748B] hover:text-[#ff6b4a] hover:bg-red-500/10 transition-colors flex-shrink-0"
              title="Remove directive"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation & Launch */}
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
          onClick={wizard.finalizeOnboarding}
          disabled={wizard.saving}
          className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#00C9A7] to-[#00A887] hover:opacity-95 text-[#070B0F] font-bold text-sm transition-all shadow-xl shadow-[#00C9A7]/25 disabled:opacity-50"
        >
          {wizard.saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Launching Your Engine…</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Launch Content Engine &amp; Draft #1</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
