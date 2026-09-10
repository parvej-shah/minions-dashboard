import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MessageSquare, Sparkles } from "lucide-react";

const VOICE_OPTIONS = [
  { title: "Direct & practical", description: "Short paragraphs, clear tradeoffs, and a useful next step. No hype." },
  { title: "Thoughtful & explanatory", description: "Teach the why before the how, with calm and precise language." },
  { title: "Bold & opinionated", description: "Lead with a strong point of view, then back it up with reasoning." },
  { title: "Warm & conversational", description: "Write like a smart colleague: clear, human, and approachable." },
] as const;

export default function StepBrandInterview({ wizard }: { wizard: OnboardingWizardState }) {
  const selectedVoice = VOICE_OPTIONS.find((option) => wizard.customSampleText === option.description)?.title;

  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-start gap-2">
        <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#00C9A7]" />
        <div>
          <h2 className="text-lg font-bold text-[#F1F5F9]">Choose your writing voice</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">Pick the closest starting point. You can train Minions with real posts later from Brand.</p>
        </div>
      </div>

      {wizard.error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{wizard.error}</div>}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {VOICE_OPTIONS.map((option) => {
          const selected = selectedVoice === option.title;
          return (
            <button key={option.title} type="button" onClick={() => wizard.setCustomSampleText(option.description)} className={`relative rounded-xl border p-3 text-left transition-colors ${selected ? "border-[#00C9A7] bg-[#00C9A7]/10 ring-1 ring-[#00C9A7]/30" : "border-[#1F2D3D] bg-[#070B0F]/60 hover:border-[#00C9A7]/50"}`}>
              <span className="block pr-5 text-xs font-bold text-[#F1F5F9]">{option.title}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-[#94A3B8]">{option.description}</span>
              {selected && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-[#00C9A7]" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9]"><Sparkles className="h-3.5 w-3.5 text-[#00C9A7]" />Optional: add one instruction</label>
        <input value={selectedVoice ? "" : wizard.customSampleText} onChange={(event) => wizard.setCustomSampleText(event.target.value)} placeholder="e.g. Avoid buzzwords. Be concise and slightly contrarian." className="mt-2 w-full border-0 bg-transparent p-0 text-xs text-[#F1F5F9] placeholder:text-[#475569] outline-none" />
      </div>

      <div className="flex items-center justify-between border-t border-[#1F2D3D]/60 pt-3">
        <button type="button" onClick={wizard.goBack} className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9]"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button type="button" onClick={wizard.generateDirectives} disabled={wizard.isGeneratingDirectives || wizard.customSampleText.trim().length < 20} className="inline-flex items-center gap-2 rounded-xl bg-[#00C9A7] px-5 py-2.5 text-sm font-bold text-[#070B0F] shadow-lg shadow-[#00C9A7]/20 transition-colors hover:bg-[#00C9A7]/90 disabled:cursor-not-allowed disabled:opacity-50">
          {wizard.isGeneratingDirectives ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {wizard.isGeneratingDirectives ? "Creating your brief…" : "Create my brief"}
          {!wizard.isGeneratingDirectives && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </section>
  );
}
