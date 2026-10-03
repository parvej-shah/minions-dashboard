import { askJev, type JevQuestion } from "@/lib/ai/jev";
import type { EditorClaim } from "@/lib/drafts/check";

/**
 * Jev labels each claim the editor model extracted; the editor's own label is
 * the fallback. On 166 stored claims labelled by hand (2026-10-03), the editor
 * called 28 checkable claims OPINION, which skips the check, and Jev 6, at a
 * median 0.3s per draft. Jev sends more opinions to review instead (25 vs 10),
 * the safe direction.
 */

const TYPES = {
  STATISTIC: "States a number, rate, amount or measurement as real",
  FACT: "States something about the world as true and checkable, without being mainly a number",
  CUSTOMER_RESULT: "What the author or their team did, saw or achieved, for clients, customers or themselves",
  MARKET_CLAIM: "A statement about what a market, industry or most companies do or are",
  PRODUCT_CLAIM: "What a named product, tool or system does or how well it performs",
  OPINION: "A view, advice, a hypothetical or a hedged example ('could', 'might', 'a shop like this'), not asserted as measured fact",
};

/** The body Jev reads for context, enough for any draft we write. */
const CONTEXT_CHARS = 12_000;

type Ask = typeof askJev;

export async function labelClaims(draft: { hook: string; body: string }, claims: EditorClaim[], ask: Ask = askJev): Promise<EditorClaim[]> {
  const texts = claims.map((c) => String(c.claim_text ?? "").trim());
  const questions: Record<string, JevQuestion> = {};
  texts.forEach((t, i) => {
    if (t) questions[`c${i}`] = { type: "choice", instructions: `Which kind of claim is this sentence from the draft: "${t}"`, criteria: TYPES };
  });
  if (!Object.keys(questions).length) return claims;

  const answers = await ask({ hook: draft.hook, body: draft.body.slice(0, CONTEXT_CHARS) }, questions);
  if (!answers) return claims;
  return claims.map((c, i) => {
    const choice = answers[`c${i}`]?.choice;
    return choice && choice in TYPES ? { ...c, claim_type: choice } : c;
  });
}
