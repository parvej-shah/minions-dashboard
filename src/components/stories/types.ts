import type { CheckedCandidate } from "@/services/pulse";

/** One note Minions drafted from an answer, and whether the author keeps it. */
export type Note = CheckedCandidate & { keep: boolean };

export interface SessionResult {
  saved: number;
  harvest: { started: boolean; message: string } | null;
}
