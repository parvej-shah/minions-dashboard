import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { Sparkles, CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]";

export default function StepIndustry({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#00C9A7]" />
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Choose a Brand Starter Pack</h2>
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">
          Select an archetype to auto-load proven editorial philosophies, content themes, and voice rules, or customize below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {BRAND_PRESETS.map((preset) => {
            const isSelected = wizard.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => wizard.applyPreset(preset)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#00C9A7]/10 border-[#00C9A7] shadow-sm shadow-[#00C9A7]/20 ring-1 ring-[#00C9A7]"
                    : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#00C9A7]/50 hover:bg-[#121B27]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#00C9A7] border border-[#00C9A7]/30">
                      {preset.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />}
                  </div>
                  <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">{preset.name}</h3>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-3 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-[#1F2D3D]/60">
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">Customize Details</h3>
        <label className="block text-xs font-medium text-[#94A3B8] mb-2">Industry / Sector</label>
        <input
          value={wizard.industry}
          onChange={(e) => {
            wizard.setSelectedPresetId(null);
            wizard.setIndustry(e.target.value);
          }}
          placeholder="e.g. AI & Developer Tools or Residential HVAC"
          className={`${inputClass} mb-4 text-xs`}
        />
        <label className="block text-xs font-medium text-[#94A3B8] mb-2">
          Who is your ideal reader, and what is your core angle?
        </label>
        <textarea
          value={wizard.icpDescription}
          onChange={(e) => {
            wizard.setSelectedPresetId(null);
            wizard.setIcpDescription(e.target.value);
          }}
          rows={3}
          placeholder="e.g. Software engineers building multi-agent systems and developer workflows..."
          className={`${inputClass} text-xs leading-relaxed`}
        />
      </div>
    </section>
  );
}
