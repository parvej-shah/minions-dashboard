/**
 * How deep the WRITER is in their own subject.
 *
 * This is the author's standing, not the reader's. It was originally modeled
 * as audience depth ("how much does your audience already know?"), which
 * turned out to be the wrong question: the reader is already described, in
 * far more detail, by the positioning and ICP directives the same onboarding
 * step collects. Asking again in a coarse 3-way picker added nothing and
 * actively contradicted the industry preset's audience lanes.
 *
 * What the pipeline could not infer from anywhere else is what the author is
 * entitled to claim. That is what this now captures, and it governs EVIDENCE
 * and STANCE -- never reading level:
 *
 *   - How assertive the piece is allowed to be.
 *   - What kind of proof it may lean on (lived experience vs. cited work).
 *   - Whether first-person operational claims are available at all.
 *
 * Reading level continues to come from the audience directives. Keeping the
 * two orthogonal is the point: a beginner writing for specialists and an
 * expert writing for executives are both coherent, and the old single axis
 * could not express either.
 */
export type WriterExpertise = "EXPLORER" | "PRACTITIONER" | "AUTHORITY";

export const DEFAULT_WRITER_EXPERTISE: WriterExpertise = "PRACTITIONER";

export interface WriterExpertiseOption {
  id: WriterExpertise;
  label: string;
  /** Shown under the label in the onboarding picker. */
  blurb: string;
  /** Injected verbatim into the harvester, writer, and copilot prompts. */
  promptGuidance: string;
}

export const WRITER_EXPERTISE_OPTIONS: WriterExpertiseOption[] = [
  {
    id: "EXPLORER",
    label: "Still learning",
    blurb: "Newer to the field. Credibility comes from research, not tenure.",
    promptGuidance:
      "The AUTHOR is early in this field and has no track record to draw on. This constrains EVIDENCE, not reading level -- the audience directives alone decide how technical the writing gets. Never write a sentence that implies years of experience, a personal war story, a client engagement, or an operational result the author achieved ('when I ran...', 'every team I've worked with...', 'in my experience...'). Never invent a metric, benchmark, named company, or quotation to fill the gap. Ground every claim in something external and checkable: the source article, public documentation, published benchmarks, or clearly-labeled reasoning. Curiosity is the honest posture -- 'here is what this changes and why it matters' rather than 'here is what I have learned the hard way'. Prefer explaining a development accurately over ruling on it. Where a judgment is genuinely warranted, mark it as a reading of the evidence, not a verdict from experience. This is a constraint on claims, never a licence to be vague or hedge everything.",
  },
  {
    id: "PRACTITIONER",
    label: "Working in it",
    blurb: "Hands-on experience. Can speak from real projects.",
    promptGuidance:
      "The AUTHOR works in this field hands-on and may speak from direct experience with their own projects and builds. First-person operational claims are available ('when we wired this up', 'the failure mode we kept hitting'), but they must stay generic to the author's own work -- never invent a named client, a specific revenue figure, or a quantified result that was not supplied. Judgments should be stated plainly and defended with the reasoning or the mechanism behind them. Confident where the author has actually done the work; explicitly provisional where they are reasoning about something they have only read about.",
  },
  {
    id: "AUTHORITY",
    label: "Deep expertise",
    blurb: "Years of depth. Can make strong calls and be believed.",
    promptGuidance:
      "The AUTHOR has deep, long-standing expertise and the standing to make strong calls. Definitive judgments are appropriate and expected -- state the position first and support it, rather than building up to a cautious maybe. Pattern claims across many cases are available ('this fails the same way every time'), as is disagreeing directly with prevailing practice. Still never fabricate a specific metric, named client, or quotation. The distinguishing move is the confident, well-reasoned verdict a newcomer could not credibly deliver.",
  },
];

export function resolveWriterExpertise(value: unknown): WriterExpertise {
  return WRITER_EXPERTISE_OPTIONS.some((o) => o.id === value)
    ? (value as WriterExpertise)
    : DEFAULT_WRITER_EXPERTISE;
}

export function writerExpertisePromptGuidance(value: unknown): string {
  const id = resolveWriterExpertise(value);
  return WRITER_EXPERTISE_OPTIONS.find((o) => o.id === id)!.promptGuidance;
}
