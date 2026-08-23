import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { TONE_FORMALITY_OPTIONS, type ToneFormality } from "@/hooks/useOnboardingWizard";

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]";

const FORMALITY_LABELS: Record<ToneFormality, string> = {
  technical_direct: "Technical & direct",
  tactile_operator: "Grounded & operational",
  conversational_peer: "Conversational",
};

export default function StepVoice({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6">
      <h2 className="text-lg font-semibold mb-4">Voice</h2>
      <label className="block text-sm font-medium text-[#94A3B8] mb-2">Overall tone</label>
      <select
        value={wizard.formality}
        onChange={(e) => wizard.setFormality(e.target.value as ToneFormality)}
        className={`${inputClass} mb-4`}
      >
        {TONE_FORMALITY_OPTIONS.map((key) => (
          <option key={key} value={key}>
            {FORMALITY_LABELS[key]}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium text-[#94A3B8] mb-2">
        Paste 3 example posts that sound like you (optional, but improves voice match)
      </label>
      {wizard.examples.map((value, i) => (
        <textarea
          key={i}
          value={value}
          onChange={(e) => wizard.updateExample(i, e.target.value)}
          rows={3}
          placeholder={`Example post ${i + 1}`}
          className={`${inputClass} mb-3`}
        />
      ))}
    </section>
  );
}
