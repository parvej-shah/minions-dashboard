import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { Sparkles, X, ArrowLeft, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { CATEGORIES } from "@/constants/brandAssets";

export default function StepConfirmDirectives({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-2xl border border-line bg-[#0D1520] p-6 sm:p-8 space-y-6 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-brand" />
          <h2 className="text-xl font-bold text-ink">Review your Brand Brief</h2>
        </div>
        <p className="text-xs sm:text-sm text-muted">
          This is Minions&apos; understanding of your brand. These writing rules guide every idea, draft, and social post — and you can edit them anytime.
        </p>
      </div>

      {wizard.error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {wizard.error}
        </div>
      )}

      {/* Positioning Summary */}
      {wizard.positioningSummary && (
        <div className="p-4 rounded-xl border border-brand/30 bg-brand/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
            <ShieldCheck className="w-4 h-4" />
            <span>Brand Strategy Summary</span>
          </div>
          <p className="text-xs text-ink leading-relaxed">{wizard.positioningSummary}</p>
        </div>
      )}

      {/* Directives List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Writing Rules ({wizard.directives.length})
        </h3>

        {wizard.directives.map((dir, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-line bg-canvas/70 flex items-start justify-between gap-3 group hover:border-brand/40 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-surface-2 text-brand border border-brand/30 uppercase">
                  {CATEGORIES.find((c) => c.value === dir.category)?.label || dir.category.replace("_", " ")}
                </span>
                <span className="text-[10px] font-mono text-subtle">{dir.rule_key}</span>
              </div>
              <p className="text-xs text-ink leading-relaxed">{dir.instruction}</p>
            </div>

            <button
              type="button"
              onClick={() => wizard.toggleDirective(idx)}
              className="p-1 rounded-lg text-subtle hover:text-coral hover:bg-red-500/10 transition-colors flex-shrink-0"
              title="Remove directive"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-canvas/60 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">How should posts go live?</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">You can change this anytime in Schedule. Review is the safer default.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => wizard.setPublishingMode("review")}
            className={`rounded-xl border p-3 text-left transition-colors ${
              wizard.publishingMode === "review"
                ? "border-brand bg-brand/10 ring-1 ring-brand/30"
                : "border-line bg-[#0D1520] hover:border-brand/40"
            }`}
          >
            <span className="block text-xs font-bold text-ink">I review every post</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted">Minions prepares drafts; nothing publishes until you approve it.</span>
          </button>
          <button
            type="button"
            onClick={() => wizard.setPublishingMode("auto")}
            className={`rounded-xl border p-3 text-left transition-colors ${
              wizard.publishingMode === "auto"
                ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                : "border-line bg-[#0D1520] hover:border-gold/40"
            }`}
          >
            <span className="block text-xs font-bold text-ink">Publish automatically</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted">Eligible scheduled drafts can publish without a manual approval step.</span>
          </button>
        </div>
      </div>

      {/* Navigation & Launch */}
      <div className="flex items-center justify-between pt-4 border-t border-line/60">
        <button
          type="button"
          onClick={wizard.goBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={wizard.finalizeOnboarding}
          disabled={wizard.saving}
          className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-brand to-[#00A887] hover:opacity-95 text-canvas font-bold text-sm transition-all shadow-xl shadow-brand/25 disabled:opacity-50"
        >
          {wizard.saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Launching Your Engine…</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Save My Brand Brief &amp; Find Ideas</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
