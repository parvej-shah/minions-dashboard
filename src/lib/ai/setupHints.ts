import { callQwen, ONBOARDING_MODEL } from "./brandCopilot";

/**
 * The grey example in a setup box, written from what the user already
 * answered: "Who should your posts reach?" follows what they want to be known
 * for, and the story box follows both. Only ever a placeholder: it is never
 * saved or sent to the writer. Null on anything unexpected, so the screen
 * keeps its fixed example.
 */

export type SetupHintField = "audience" | "story";

export interface SetupHintInput {
  field: SetupHintField;
  contentFocus: string;
  audienceDescription?: string;
}

const MIN_HINT = 8;
const MAX_HINT = 110;
/** A placeholder that arrives late is worse than the fixed one. */
const TIMEOUT_MS = 8000;

const ASK: Record<SetupHintField, string> = {
  audience:
    'Write one example answer to "Who should your posts reach?" for this person: a specific group of buyers, 4-10 words, like "Owners of 10-person agencies" or "Brokerage owners who lose leads after hours".',
  story:
    'Write one example answer to "What should your first post be about?" for this person: the start of a true-sounding moment from their work, 8-16 words, first person, ending in "…", like "The client who nearly left until we changed one thing…".',
};

export function buildSetupHintsPrompt(input: SetupHintInput): string {
  const audience = input.field === "story" && input.audienceDescription?.trim() ? `\nWho they write for: ${input.audienceDescription.trim().slice(0, 300)}` : "";
  return `A founder is setting up LinkedIn posts. What they want to be known for: ${input.contentFocus.trim().slice(0, 300)}${audience}

${ASK[input.field]}
Plain words, no buzzwords, no names of real people or companies, no numbers they didn't give.

Return ONLY JSON: {"hint": "..."}`;
}

/** One short line, without "e.g.", quotes or a closing full stop. */
export function cleanHint(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const hint = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^e\.g\.?,?\s*/i, "")
    .replace(/^["'“‘]+|["'”’]+$/g, "")
    .replace(/(?<!\.)\.$/, "")
    .trim();
  return hint.length >= MIN_HINT && hint.length <= MAX_HINT ? hint : null;
}

export function parseSetupHints(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")) as { hint?: unknown };
    return cleanHint(parsed?.hint);
  } catch {
    return null;
  }
}

export async function generateSetupHints(input: SetupHintInput): Promise<string | null> {
  if (input.contentFocus.trim().length < 3) return null;
  const raw = await callQwen(buildSetupHintsPrompt(input), TIMEOUT_MS, { ...ONBOARDING_MODEL, max_tokens: 120 });
  return parseSetupHints(raw);
}
