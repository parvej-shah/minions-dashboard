import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]";

export default function StepIndustry({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6">
      <h2 className="text-lg font-semibold mb-4">Industry &amp; audience</h2>
      <label className="block text-sm font-medium text-[#94A3B8] mb-2">Industry</label>
      <input
        value={wizard.industry}
        onChange={(e) => wizard.setIndustry(e.target.value)}
        placeholder="e.g. Residential plumbing"
        className={`${inputClass} mb-4`}
      />
      <label className="block text-sm font-medium text-[#94A3B8] mb-2">
        Who&apos;s your ideal reader, and what do you want them to take away?
      </label>
      <textarea
        value={wizard.icpDescription}
        onChange={(e) => wizard.setIcpDescription(e.target.value)}
        rows={4}
        placeholder="e.g. Owners of 5-20 truck plumbing companies who miss emergency calls after hours..."
        className={inputClass}
      />
    </section>
  );
}
