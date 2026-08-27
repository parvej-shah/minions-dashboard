import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { TONE_FORMALITY_OPTIONS, type ToneFormality } from "@/hooks/useOnboardingWizard";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { Sparkles, MessageSquare } from "lucide-react";

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]";

const FORMALITY_LABELS: Record<ToneFormality, string> = {
  technical_direct: "Technical & direct (Stripe/Linear style, engineering rigor)",
  tactile_operator: "Grounded & operational (Contractor & field-first, zero fluff)",
  conversational_peer: "Conversational & analytical (Engaging thought leadership, clear ROI)",
};

const EXAMPLE_PLACEHOLDERS = [
  "Example 1: A punchy observation or contrarian insight from your industry...",
  "Example 2: A practical breakdown of a workflow, lesson, or framework...",
  "Example 3: A concrete story, case breakdown, or analytical perspective...",
];

export default function StepVoice({ wizard }: { wizard: OnboardingWizardState }) {
  const currentPreset = BRAND_PRESETS.find((p) => p.id === wizard.selectedPresetId) || BRAND_PRESETS[0];

  const handleLoadPresetExamples = () => {
    if (currentPreset?.examplePosts) {
      wizard.updateExample(0, currentPreset.examplePosts[0] || "");
      wizard.updateExample(1, currentPreset.examplePosts[1] || "");
      wizard.updateExample(2, currentPreset.examplePosts[2] || "");
    }
  };

  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1 text-[#F1F5F9]">Brand Voice &amp; Tone</h2>
        <p className="text-xs text-[#94A3B8] mb-4">
          Tune how the AI Writer shapes sentences, tone, and rhythm.
        </p>

        <label className="block text-xs font-medium text-[#94A3B8] mb-2">Overall Formality</label>
        <select
          value={wizard.formality}
          onChange={(e) => wizard.setFormality(e.target.value as ToneFormality)}
          className={`${inputClass} mb-4 text-xs`}
        >
          {TONE_FORMALITY_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {FORMALITY_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-[#1F2D3D]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F1F5F9]">
              <MessageSquare className="w-3.5 h-3.5 text-[#00C9A7]" />
              <h3>Few-Shot Voice Match (3 Example Posts)</h3>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Paste 3 posts or articles that sound like you. The AI mimics your natural sentence flow.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadPresetExamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00C9A7]/40 bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] text-xs font-medium transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Examples</span>
          </button>
        </div>

        <div className="space-y-3">
          {wizard.examples.map((value, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#94A3B8]">POST {i + 1}</span>
              </div>
              <textarea
                value={value}
                onChange={(e) => wizard.updateExample(i, e.target.value)}
                rows={3}
                placeholder={EXAMPLE_PLACEHOLDERS[i]}
                className={`${inputClass} text-xs leading-relaxed`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
