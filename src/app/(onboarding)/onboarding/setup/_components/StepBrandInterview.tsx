import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { Sparkles, MessageSquare, ArrowLeft, Loader2, ShieldAlert, Target, Lightbulb } from "lucide-react";

const textareaClass =
  "w-full rounded-xl bg-[#070B0F] border border-[#1F2D3D] p-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-xs leading-relaxed";

interface SuggestionSet {
  myths: string[];
  differentiators: string[];
  avoids: string[];
}

const INDUSTRY_SUGGESTIONS: Record<string, SuggestionSet> = {
  ai_tech_builders: {
    myths: [
      "Believing prompt engineering alone is enough without deterministic schema validation",
      "Focusing purely on token speed rather than graceful error recovery and tool schemas",
      "Treating AI agents as chat bots instead of stateful backend workflow orchestrators",
    ],
    differentiators: [
      "Deterministic schema validation and sub-second multi-agent orchestration",
      "Production-grade error recovery with strict stateful rollback",
      "Practical engineering rigor with zero AI hype or corporate fluff",
    ],
    avoids: [
      "Never quote unverified customer metrics or speculative benchmark claims",
      "Avoid empty marketing buzzwords like 'seamless', 'game-changing', or 'revolutionize'",
      "No unverified technical guarantees without reproducible code",
    ],
  },
  b2b_saas_growth: {
    myths: [
      "Pouring money into top-of-funnel acquisition while ignoring onboarding churn",
      "Assuming more product features automatically leads to higher customer retention",
      "Offering complex self-serve tiers without guided activation benchmarks",
    ],
    differentiators: [
      "Guaranteed 30-day time-to-value activation framework",
      "Data-backed unit economics and practical retention playbooks",
      "Hands-on operator support with transparent pricing",
    ],
    avoids: [
      "Never promise specific revenue multiples or guaranteed conversion rates",
      "Avoid corporate jargon without actionable implementation steps",
      "No unverified competitor comparisons",
    ],
  },
  home_services_contractor: {
    myths: [
      "Contractors who charge hourly instead of giving transparent upfront flat-rate quotes",
      "Pushing complete unit replacements when a simple component repair solves the issue",
      "Assuming the lowest bidder will deliver the same quality and warranty protection",
    ],
    differentiators: [
      "Guaranteed 45-minute emergency response with live technician tracking",
      "Upfront flat-rate pricing with zero hidden trip fees",
      "Licensed master technicians with a 100% clean-home satisfaction guarantee",
    ],
    avoids: [
      "Never quote exact dollar pricing online without an on-site inspection",
      "Do not advise homeowners on dangerous DIY electrical or gas repairs",
      "Avoid unverified claims about competitor licensing",
    ],
  },
  enterprise_erp_consulting: {
    myths: [
      "Attempting to migrate 10 years of dirty historical transactions during ERP cutover",
      "Treating software migration as an IT job rather than a business workflow alignment",
      "Heavily custom-coding modules before testing proven out-of-the-box workflows",
    ],
    differentiators: [
      "Deterministic data forensics protocol ensuring zero cutover business downtime",
      "Direct senior architect implementation with zero junior handoffs",
      "Modular phased deployment delivering immediate ROI in 60 days",
    ],
    avoids: [
      "Never promise unrealistic cutover timelines without data audits",
      "Do not disclose confidential client migration architecture",
      "Avoid generic consultant buzzwords without operational proof",
    ],
  },
};

export default function StepBrandInterview({ wizard }: { wizard: OnboardingWizardState }) {
  const presetKey = wizard.selectedPresetId || "ai_tech_builders";
  const presetFallback = INDUSTRY_SUGGESTIONS[presetKey] || INDUSTRY_SUGGESTIONS.ai_tech_builders;
  // Prefer AI-generated suggestions from LinkedIn import; fall back to hardcoded preset chips
  const suggestions = wizard.aiSuggestions ?? presetFallback;
  const isAiPowered = !!wizard.aiSuggestions;

  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xl">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C9A7] shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#F1F5F9] leading-snug">2-Minute Brand Interview</h2>
          </div>
          {isAiPowered && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-[#00C9A7] shrink-0">
              <Sparkles className="w-3 h-3" /> AI from LinkedIn
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          {isAiPowered
            ? "Suggestions below are personalised from your LinkedIn posts. Tap to use or type your own."
            : "Tap a suggestion or type your own perspective. Our AI Copilot will turn your answers into sharp, high-converting editorial guardrails."}
        </p>
      </div>

      {wizard.error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {wizard.error}
        </div>
      )}

      <div className="space-y-4">
        {/* Question 1 */}
        <div className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 space-y-2.5">
          <label className="block text-xs font-semibold text-[#F1F5F9] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>1. What common myth or bad advice in your industry do you disagree with?</span>
          </label>
          <textarea
            rows={2}
            value={wizard.mythAnswer}
            onChange={(e) => wizard.setMythAnswer(e.target.value)}
            placeholder="Type your contrarian perspective or tap a suggestion below..."
            className={textareaClass}
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {suggestions.myths.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => wizard.setMythAnswer(text)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                  wizard.mythAnswer === text
                    ? "bg-[#00C9A7]/15 border-[#00C9A7] text-[#00C9A7]"
                    : "bg-[#0D1520] border-[#1F2D3D] text-[#94A3B8] hover:border-[#00C9A7]/50 hover:text-white"
                }`}
              >
                ✦ {text}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 space-y-2.5">
          <label className="block text-xs font-semibold text-[#F1F5F9] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00C9A7]" />
            <span>2. What is your #1 differentiator (why do clients hire you)?</span>
          </label>
          <textarea
            rows={2}
            value={wizard.differentiatorAnswer}
            onChange={(e) => wizard.setDifferentiatorAnswer(e.target.value)}
            placeholder="Type what makes your execution unique or tap a suggestion below..."
            className={textareaClass}
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {suggestions.differentiators.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => wizard.setDifferentiatorAnswer(text)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                  wizard.differentiatorAnswer === text
                    ? "bg-[#00C9A7]/15 border-[#00C9A7] text-[#00C9A7]"
                    : "bg-[#0D1520] border-[#1F2D3D] text-[#94A3B8] hover:border-[#00C9A7]/50 hover:text-white"
                }`}
              >
                ✦ {text}
              </button>
            ))}
          </div>
        </div>

        {/* Question 3 */}
        <div className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 space-y-2.5">
          <label className="block text-xs font-semibold text-[#F1F5F9] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>3. What topics or claims should we STRICTLY AVOID?</span>
          </label>
          <textarea
            rows={2}
            value={wizard.avoidAnswer}
            onChange={(e) => wizard.setAvoidAnswer(e.target.value)}
            placeholder="Type your editorial red lines or tap a suggestion below..."
            className={textareaClass}
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {suggestions.avoids.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => wizard.setAvoidAnswer(text)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                  wizard.avoidAnswer === text
                    ? "bg-rose-500/15 border-rose-500 text-rose-300"
                    : "bg-[#0D1520] border-[#1F2D3D] text-[#94A3B8] hover:border-rose-500/50 hover:text-white"
                }`}
              >
                ✦ {text}
              </button>
            ))}
          </div>
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
