import type { CheckedCandidate, PulseDTO } from "@/services/pulse";

/** The approval-moment ask is for any week the question is on and not yet answered or skipped. */
export function shouldAsk(state: PulseDTO["state"]): boolean {
  return state !== "OFF" && state !== "DONE";
}

/** Flagged notes open in the full editor on Today; the quick ask never edits them. */
export function notesNeedLook(candidates: Pick<CheckedCandidate, "check">[]): boolean {
  return candidates.some((c) => Boolean(c.check?.confidential || c.check?.issues.length));
}
