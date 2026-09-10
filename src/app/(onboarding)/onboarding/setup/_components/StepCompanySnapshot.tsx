import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { Globe, Building2, Sparkles, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-xl bg-[#070B0F] border border-[#1F2D3D] px-3.5 py-2.5 sm:px-4 sm:py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-sm";

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
      } catch {}
    }
  };

  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C9A7] shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-[#F1F5F9] leading-snug">Start with your brand</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          A few honest details give Minions the context to find ideas that are relevant to your work — not generic content prompts.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
          Who do you want your content to reach?
        </label>
        <textarea
          rows={3}
          value={wizard.audienceDescription}
          onChange={(e) => wizard.setAudienceDescription(e.target.value)}
          placeholder="For example: operations leaders at growing B2B companies who need a clearer way to adopt AI."
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <p className="mt-1.5 text-[11px] text-[#64748B]">A role, industry, problem, or audience is enough. You can refine this later.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
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
            <Building2 className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
            Business Name
            {wizard.businessNameFromLinkedIn && (
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0077b5]/10 border border-[#0077b5]/30 text-[#0077b5]">
                ✓ From LinkedIn
              </span>
            )}
          </label>
          <input
            type="text"
            value={wizard.businessName}
            onChange={(e) => wizard.setBusinessName(e.target.value)}
            placeholder="e.g. Brain Station 23"
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#1F2D3D]/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#00C9A7] shrink-0" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Pick your primary industry</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          {BRAND_PRESETS.map((preset) => {
            const isSelected = wizard.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => wizard.applyPreset(preset)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#00C9A7]/10 border-[#00C9A7] shadow-sm shadow-[#00C9A7]/20 ring-1 ring-[#00C9A7]"
                    : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#00C9A7]/50 hover:bg-[#121B27]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#00C9A7] border border-[#00C9A7]/30">
                      {preset.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#F1F5F9] mb-0.5">{preset.name}</h4>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">
            Not one of these? Describe your own industry
          </label>
          <input
            type="text"
            value={wizard.selectedPresetId ? "" : wizard.industry}
            onChange={(e) => {
              wizard.setIndustry(e.target.value);
              wizard.setSelectedPresetId(null);
            }}
            placeholder="e.g. Landscaping, Legal Services, Boutique Retail"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-[#1F2D3D]/60">
        <button
          type="button"
          onClick={wizard.goToBrandInterview}
          disabled={wizard.isGeneratingSuggestions}
          className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-[#00C9A7]/20 cursor-pointer disabled:opacity-60"
        >
          {wizard.isGeneratingSuggestions ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Personalizing…</span>
            </>
          ) : (
            <>
          <span>Next: Your Perspective</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
