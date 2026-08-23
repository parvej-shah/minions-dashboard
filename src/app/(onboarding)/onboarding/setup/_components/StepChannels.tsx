import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";

const CHANNEL_OPTIONS = [
  { key: "blog", label: "Blog" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X / Twitter" },
] as const;

export default function StepChannels({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6">
      <h2 className="text-lg font-semibold mb-1">Channels</h2>
      <p className="text-xs text-[#64748B] mb-4">
        You&apos;ll connect these to your real accounts right after — nothing to paste here yet.
      </p>
      <div className="flex flex-wrap gap-2">
        {CHANNEL_OPTIONS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => wizard.toggleChannel(c.key)}
            className={`rounded-full border px-4 py-2 text-sm ${
              wizard.channels.includes(c.key)
                ? "border-[#00C9A7] bg-[#00C9A7]/10 text-[#00C9A7]"
                : "border-[#1F2D3D] text-[#94A3B8]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
