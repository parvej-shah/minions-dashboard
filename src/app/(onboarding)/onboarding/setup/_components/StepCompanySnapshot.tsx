import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { Globe, Building2, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-sm";

export default function StepCompanySnapshot({ wizard }: { wizard: OnboardingWizardState }) {
  const handleUrlBlur = () => {
    if (wizard.websiteUrl && !wizard.businessName) {
      try {
        const hostname = new URL(
          wizard.websiteUrl.startsWith("http") ? wizard.websiteUrl : `https://${wizard.websiteUrl}`
        ).hostname.replace("www.", "");
        const inferredName = hostname.split(".")[0];
        if (inferredName) {
          wizard.setBusinessName(inferredName.charAt(0).toUpperCase() + inferredName.slice(1));
        }
      } catch (e) {}
    }
  };

  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-6 sm:p-8 space-y-6 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Building2 className="w-5 h-5 text-[#00C9A7]" />
          <h2 className="text-xl font-bold text-[#F1F5F9]">Let&apos;s set up your brand</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8]">
          Tell us about your business so Minions can tailor every post and editorial draft to your industry.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#00C9A7]" />
            Company Website
          </label>
          <input
            type="url"
            value={wizard.websiteUrl}
            onChange={(e) => wizard.setWebsiteUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="e.g. acmehvac.com or mycompany.io"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#00C9A7]" />
            Business Name
          </label>
          <input
            type="text"
            value={wizard.businessName}
            onChange={(e) => wizard.setBusinessName(e.target.value)}
            placeholder="e.g. Acme Air Conditioning"
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#1F2D3D]/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#00C9A7]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Pick your primary industry</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                  <h4 className="text-sm font-semibold text-[#F1F5F9] mb-1">{preset.name}</h4>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#1F2D3D]/60">
        <button
          type="button"
          onClick={() => wizard.setStep(0)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => wizard.setStep(2)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] font-semibold text-sm transition-colors shadow-lg shadow-[#00C9A7]/20"
        >
          <span>Next: 2-Minute Brand Interview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
