/**
 * How deep the tenant's audience already is in their subject.
 *
 * Captured once in onboarding, stored on BrandProfile, and surfaced to the
 * n8n pipeline through /api/brand/context. Both the idea harvester and the
 * 02_idea_to_asset writer read the same value, so idea depth and draft depth
 * can't drift apart -- before this, each prompt guessed independently and a
 * "explain the basics" idea could come back written for a specialist.
 */
export type AudienceExpertise = "PRACTITIONER" | "OPERATOR" | "EXECUTIVE";

export const DEFAULT_AUDIENCE_EXPERTISE: AudienceExpertise = "OPERATOR";

export interface AudienceExpertiseOption {
  id: AudienceExpertise;
  label: string;
  /** Shown under the label in the onboarding picker. */
  blurb: string;
  /** Injected verbatim into the harvester and writer prompts. */
  promptGuidance: string;
}

export const AUDIENCE_EXPERTISE_OPTIONS: AudienceExpertiseOption[] = [
  {
    id: "PRACTITIONER",
    label: "Practitioners",
    blurb: "They do this work daily. Skip the basics.",
    promptGuidance:
      "The audience does this work daily and is bored by introductions. Assume fundamentals are known and never define common terms. Go straight to mechanism, trade-offs, edge cases, and failure modes. Domain vocabulary is expected; use it precisely. An idea that merely explains what something is has no value here -- it must add a non-obvious insight a working specialist has not already had.",
  },
  {
    id: "OPERATOR",
    label: "Operators & managers",
    blurb: "Mixed room. Explain the why before the how.",
    promptGuidance:
      "The audience is capable but not specialist. Establish why something matters before explaining how it works. Introduce a technical term the first time it appears, in one clause, then use it freely. Favor concrete scenarios and decision criteria over deep implementation detail. Aim for the reader who has to choose or oversee, not personally build.",
  },
  {
    id: "EXECUTIVE",
    label: "Executives & buyers",
    blurb: "Outcomes, cost, and risk. Light on detail.",
    promptGuidance:
      "The audience judges by outcome, cost, risk, and timeline. Lead with business consequence, not mechanism. Keep implementation detail to the minimum needed for credibility, and translate anything technical into its operational or financial effect. Avoid jargon entirely; where a term is unavoidable, give its business meaning rather than its definition.",
  },
];

export function resolveAudienceExpertise(value: unknown): AudienceExpertise {
  return AUDIENCE_EXPERTISE_OPTIONS.some((o) => o.id === value)
    ? (value as AudienceExpertise)
    : DEFAULT_AUDIENCE_EXPERTISE;
}

export function expertisePromptGuidance(value: unknown): string {
  const id = resolveAudienceExpertise(value);
  return AUDIENCE_EXPERTISE_OPTIONS.find((o) => o.id === id)!.promptGuidance;
}
