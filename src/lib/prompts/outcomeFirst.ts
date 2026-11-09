import { icpBuyer } from "@/constants/contentLanes";
import type { DraftAuthorContext } from "@/lib/drafts/authorContext";

/**
 * Most ICPs are business owners: they buy what changes in their business, not
 * the technology behind it (user, 2026-11-09). A workspace whose ICP is set to
 * TECHNICAL keeps the technical depth. Ideas with no author context get neither.
 */
export function buysOutcome(author: DraftAuthorContext | undefined): boolean {
  return !!author?.found && icpBuyer(author.icp) === "OUTCOME";
}

export const OUTCOME_FIRST = `OUTCOME FIRST: This reader buys the outcome, not the technology. Lead with what changes in their business or day: customers won or lost, time, money, risk, the work they no longer have to do. Mention how it works in at most one sentence per point, as the reason it works, in words the reader uses. No technical terms the reader would not say to a colleague (latency, model, API, pipeline, integration, stack, LLM) unless they are in the ICP's own words; say what they mean instead ("the pause before it answers", "it books the slot in your calendar"). A paragraph the reader could not repeat to their business partner gets rewritten.`;

/** Appended to the strategist's cover headline rule for an outcome buyer. */
export const OUTCOME_COVER = ` This reader buys the outcome, so name the consequence the reader feels (lost leads, missed bookings, wasted hours), not the technical metric or component behind it (not 'Latency over 1.8 seconds kills calls' but 'Slow answers lose you callers').`;
