/**
 * TypeSafe's Jev: a model that answers typed questions about a text (a yes/no
 * probability, a pick from a set, or a score on ordered levels) instead of
 * writing. Used where the pipeline needs a judgement, not prose.
 *
 * POST https://api.typesafe.ai/v1/systemone, Bearer TYPESAFE_API_KEY
 * (console.typesafe.ai). Answers in well under a second.
 */

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const TIMEOUT_MS = 15_000;

export type JevQuestion =
  | { type: "noul"; instructions: string }
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "score"; instructions: string; criteria: string[] };

export interface JevAnswer {
  type: JevQuestion["type"];
  /** noul: probability of yes, 0 to 1. */
  noul?: number;
  /** choice: the picked option's key. */
  choice?: string;
  /** score: position on the criteria list, 0-based and fractional (1.4 is between levels 1 and 2). */
  score?: number;
  confidence?: number;
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Asks Jev the questions about `state`. Null when there is no key or the call
 * fails: every caller has a code fallback, so Jev is never what stops a run.
 */
export async function askJev(
  state: unknown,
  questions: Record<string, JevQuestion>,
  { apiKey = process.env.TYPESAFE_API_KEY, fetchImpl = fetch as Fetch } = {}
): Promise<Record<string, JevAnswer> | null> {
  if (!apiKey) return null;
  try {
    const res = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "jev-latest", state, questions }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[jev] answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { answers?: Record<string, JevAnswer> };
    return json.answers && typeof json.answers === "object" ? json.answers : null;
  } catch (e) {
    console.warn("[jev] call failed:", e);
    return null;
  }
}
