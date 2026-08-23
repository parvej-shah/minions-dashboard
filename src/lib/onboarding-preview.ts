import type { ToneFormality } from "@/hooks/useOnboardingWizard";

export interface PreviewInput {
  industry: string;
  icpDescription: string;
  channels: string[];
  formality: ToneFormality;
}

export interface PreviewOutput {
  headline: string;
  angleSummary: string;
  channelLabel: string;
}

const CHANNEL_NAMES: Record<string, string> = {
  blog: "Blog",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
};

/**
 * Cosmetic, instant reassurance for the onboarding wizard -- not the real
 * draft (that comes from the actual pipeline after signup). Pure template
 * interpolation, no network call: cheap enough to recompute on every
 * keystroke and doesn't need to be exactly right, just plausible.
 */
export function buildOnboardingPreview(input: PreviewInput): PreviewOutput | null {
  const industry = input.industry.trim();
  const icp = input.icpDescription.trim();
  if (industry.length < 3 || icp.length < 15) return null;

  const audience = extractAudiencePhrase(icp) ?? `${industry} customers`;

  const headline =
    input.formality === "technical_direct"
      ? `${capitalize(industry)}: 5 operational fixes ${audience} ask about most`
      : input.formality === "tactile_operator"
        ? `What ${audience} actually want from a ${industry.toLowerCase()} team`
        : `5 things ${audience} wish their ${industry.toLowerCase()} provider did differently`;

  const angleSummary = `Built around what you told us: ${truncate(icp, 110)}`;

  const selected = input.channels.length > 0 ? input.channels : ["blog"];
  const channelLabel = `First post lands on: ${selected
    .map((key) => CHANNEL_NAMES[key] ?? key)
    .join(" + ")}`;

  return { headline, angleSummary, channelLabel };
}

/** Light extraction of an audience noun phrase from free-typed ICP text. */
function extractAudiencePhrase(icp: string): string | null {
  const match = icp.match(/\b(owners?|operators?|managers?|teams?|founders?) of ([^.,;]{3,50})/i);
  if (match) return `${match[1].toLowerCase()} of ${match[2].trim()}`;

  const who = icp.match(/^([^.,;]{3,50})\bwho\b/i);
  if (who) return who[1].trim().toLowerCase();

  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
}
