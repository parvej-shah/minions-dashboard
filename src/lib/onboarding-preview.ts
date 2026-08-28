export type ToneFormality = "technical_direct" | "tactile_operator" | "conversational_peer";

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
  const match = icp.match(/\b(owners?|operators?|managers?|teams?|founders?) of ([^.,;]{3,80})/i);
  if (match) return `${match[1].toLowerCase()} of ${truncateToWord(match[2].trim(), 45)}`;

  const who = icp.match(/^([^.,;]{3,80})\bwho\b/i);
  if (who) return truncateToWord(who[1].trim(), 45).toLowerCase();

  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
}

/** Truncates without ever splitting a word in half -- unlike a plain slice,
 * which can leave a dangling word fragment ("...because the") that then
 * reads as broken grammar once the template appends more text after it. */
function truncateToWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
}
