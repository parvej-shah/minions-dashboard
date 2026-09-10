import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { Globe, Building2, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

// Onboarding needs only a broad starting lane. The two required prompts above
// provide the actual audience and subject specificity; detailed industry
// calibration belongs in Brand after the user has reached their first ideas.
const ONBOARDING_PRESET_IDS = ["ai_tech_builders", "b2b_saas_growth"];

const inputClass =
  "w-full rounded-xl bg-[#070B0F] border border-[#1F2D3D] px-3.5 py-2.5 sm:px-4 sm:py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-sm";

const ideaInputClass =
  "w-full min-h-14 rounded-xl bg-[#070B0F] border border-[#1F2D3D] px-3.5 py-3 sm:px-4 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-sm leading-relaxed";

export default function StepCompanySnapshot({ wizard }: { wizard: OnboardingWizardState }) {
  const hasIdeaContext = wizard.audienceDescription.trim().length >= 3 && wizard.contentFocus.trim().length >= 3;
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
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-4 sm:p-5 space-y-3 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C9A7] shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-[#F1F5F9] leading-snug">Start with your brand</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          Tell us who you write for. We&apos;ll use this to make the first ideas relevant, not generic.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">What do you want to be known for? <span className="text-[#00C9A7]">*</span></label>
        <input
          type="text"
          value={wizard.contentFocus}
          onChange={(e) => wizard.setContentFocus(e.target.value)}
          placeholder="e.g. Practical AI tools, developer workflows, and real-world use cases"
          className={ideaInputClass}
        />
        <p className="mt-1.5 text-xs text-[#64748B]">This gives Minions a clear territory for your first ideas.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">
          Who do you want your content to reach? <span className="text-[#00C9A7]">*</span>
        </label>
        <textarea
          rows={2}
          value={wizard.audienceDescription}
          onChange={(e) => wizard.setAudienceDescription(e.target.value)}
          placeholder="For example: operations leaders at growing B2B companies who need a clearer way to adopt AI."
          className={`${ideaInputClass} min-h-20 resize-y`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
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
          <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
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

      <div className="border-t border-[#1F2D3D]/60 pt-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-[#00C9A7]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Industry <span className="font-normal text-[#64748B]">(optional context)</span></h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BRAND_PRESETS.filter((preset) => ONBOARDING_PRESET_IDS.includes(preset.id)).map((preset) => {
            const isSelected = wizard.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => wizard.applyPreset(preset)}
                className={`text-left rounded-lg border px-2.5 py-2 transition-all ${
                  isSelected
                    ? "bg-[#00C9A7]/10 border-[#00C9A7] shadow-sm shadow-[#00C9A7]/20 ring-1 ring-[#00C9A7]"
                    : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#00C9A7]/50 hover:bg-[#121B27]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold leading-snug text-[#F1F5F9]">{preset.name}</h4>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#00C9A7]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-[#1F2D3D]/60 pt-3">
        <button
          type="button"
          onClick={wizard.goToBrandInterview}
          disabled={!hasIdeaContext}
          className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-[#00C9A7]/20 cursor-pointer disabled:opacity-60"
        >
          <span>Next: Choose your voice</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
