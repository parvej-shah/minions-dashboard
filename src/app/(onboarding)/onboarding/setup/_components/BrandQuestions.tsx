"use client";

import { useCallback } from "react";
import { Crown, Globe, Sprout, Wrench } from "lucide-react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import { WRITER_EXPERTISE_OPTIONS, type WriterExpertise } from "@/constants/writerExpertise";
import { ExampleChip, OptionList, Question, lessonInput, type Option } from "./lesson";

/** Enough text to count as an answer to the two required questions. */
export const MIN_ANSWER = 3;

// Onboarding needs only a broad starting lane. The two required questions
// give the real audience and subject; detailed industry calibration belongs
// in Brand after the user has reached their first ideas.
const ONBOARDING_PRESET_IDS = ["ai_tech_builders", "b2b_saas_growth"];

const FOCUS_EXAMPLES = ["Practical AI for developers", "Growing a B2B SaaS", "Real estate and proptech", "Engineering leadership"];
const AUDIENCE_EXAMPLES = ["Founders of early-stage startups", "Engineering managers", "Operations leaders at B2B companies", "Real estate agents and brokers"];

export function FocusQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <>
      <Question title="What do you want to be known for?" hint="Your territory. Every idea Minions finds for you starts here." />
      <input
        autoFocus
        type="text"
        value={wizard.contentFocus}
        onChange={(e) => wizard.setContentFocus(e.target.value)}
        placeholder="e.g. Practical AI tools and real-world use cases"
        aria-label="What you want to be known for"
        className={`${lessonInput} mt-6`}
      />
      <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-subtle">Or tap one to start</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {FOCUS_EXAMPLES.map((example) => (
          <ExampleChip key={example} selected={wizard.contentFocus === example} onClick={() => wizard.setContentFocus(example)}>
            {example}
          </ExampleChip>
        ))}
      </div>
    </>
  );
}

export function AudienceQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  return (
    <>
      <Question title="Who do you want your posts to reach?" hint="Be specific. “CTOs at 50-person startups” beats “tech people”." />
      <textarea
        autoFocus
        rows={3}
        value={wizard.audienceDescription}
        onChange={(e) => wizard.setAudienceDescription(e.target.value)}
        placeholder="e.g. Operations leaders at growing B2B companies who need a clearer way to adopt AI"
        aria-label="Who your posts should reach"
        className={`${lessonInput} mt-6 resize-none`}
      />
      <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-subtle">Or tap one to start</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {AUDIENCE_EXAMPLES.map((example) => (
          <ExampleChip key={example} selected={wizard.audienceDescription === example} onClick={() => wizard.setAudienceDescription(example)}>
            {example}
          </ExampleChip>
        ))}
      </div>
    </>
  );
}

const EXPERTISE_ICONS: Record<WriterExpertise, React.ReactNode> = {
  EXPLORER: <Sprout className="h-6 w-6" strokeWidth={2.25} />,
  PRACTITIONER: <Wrench className="h-6 w-6" strokeWidth={2.25} />,
  AUTHORITY: <Crown className="h-6 w-6" strokeWidth={2.25} />,
};

const EXPERTISE_OPTIONS: Option<WriterExpertise>[] = WRITER_EXPERTISE_OPTIONS.map((o) => ({
  id: o.id,
  title: o.label,
  body: o.blurb,
  icon: EXPERTISE_ICONS[o.id],
}));

/** Footer praise once an experience level is chosen: what it lets the posts claim. */
export const EXPERTISE_PRAISE: Record<WriterExpertise, string> = {
  EXPLORER: "Got it. We'll back your posts with research.",
  PRACTITIONER: "Nice. Your posts can speak from real projects.",
  AUTHORITY: "Great. Your posts can make strong calls.",
};

export function ExpertiseQuestion({ wizard }: { wizard: OnboardingWizardState }) {
  const { setWriterExpertise } = wizard;
  const choose = useCallback((id: WriterExpertise) => setWriterExpertise(id), [setWriterExpertise]);
  return (
    <>
      <Question
        title="How deep is your experience in this field?"
        hint="This sets what your posts may claim as proof. You can change it later in Brand."
      />
      <div className="mt-6">
        <OptionList label="Your experience" options={EXPERTISE_OPTIONS} value={wizard.writerExpertise} onChange={choose} />
      </div>
    </>
  );
}

export function BusinessQuestion({ wizard }: { wizard: OnboardingWizardState }) {
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
    <>
      <Question title="Where do you work?" hint="Optional. It helps posts mention the right name and link to the right site." />
      <div className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-extrabold text-muted">Website</span>
          <span className="relative block">
            <Globe className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              value={wizard.websiteUrl}
              onChange={(e) => wizard.setWebsiteUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="yourcompany.com"
              className={`${lessonInput} pl-12`}
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-muted">
            Company or brand name
            {wizard.businessNameFromLinkedIn && (
              <span className="rounded-full bg-[#0077b5]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8ed3ff]">From LinkedIn</span>
            )}
          </span>
          <input
            type="text"
            autoComplete="organization"
            value={wizard.businessName}
            onChange={(e) => wizard.setBusinessName(e.target.value)}
            placeholder="e.g. Brain Station 23"
            className={lessonInput}
          />
        </label>
      </div>

      <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-subtle">Closest field</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {BRAND_PRESETS.filter((preset) => ONBOARDING_PRESET_IDS.includes(preset.id)).map((preset) => (
          <ExampleChip key={preset.id} selected={wizard.selectedPresetId === preset.id} onClick={() => wizard.applyPreset(preset)}>
            {preset.name}
          </ExampleChip>
        ))}
      </div>
    </>
  );
}
