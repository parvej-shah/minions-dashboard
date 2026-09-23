import { numbersIn, sharedWords, unsupportedNumbers } from "@/lib/harvest/text";
import { leakedSpecifics } from "./generalize";
import { measure, readabilityIssues, reflowParagraphs, type Readability } from "./readability";

/**
 * The draft check (phase 4), run on every edited draft before it is saved.
 * It replaced the claims gate that lived in 02's Parse Claims and Gate node,
 * and closes its loopholes:
 *
 *  - The gate only saw claims the editor model chose to extract, and a
 *    hedged number ("could save 30%") was extracted as OPINION and passed.
 *    Figures are now found in code: any number the draft states that appears
 *    in no input blocks it, however it is phrased.
 *  - A draft could use a GENERALIZE item's names or figures. They block it.
 *  - A draft with no experience behind it could still say "we built" or "one
 *    of our clients". That now needs review.
 *
 *   claims_ok  Y        every checkable claim is backed
 *              N        something needs a reviewer's eye (unbacked claim, first-person without experience)
 *              BLOCKED  invented figure, Generalize leak, or an unapproved customer result
 */

export type ClaimsOk = "Y" | "N" | "BLOCKED";

export interface EditorClaim {
  claim_text?: unknown;
  claim_type?: unknown;
}

export interface CheckedClaim {
  claim_text: string;
  claim_type: string;
  source_url: string;
  source_title: string;
  verified: "Y" | "N" | "NA";
}

export interface DraftCheckInput {
  hook: string;
  body: string;
  claims: EditorClaim[];
  approvedProofs: { claim: string; sourceUrl: string; sourceTitle?: string }[];
  allowCustomerResult: boolean;
  trustBasis: string[];
  /** The idea's memory items: original text, disclosure, and the lesson-only text the writer saw. */
  memory: { content: string; disclosure: string; generalizedContent: string | null }[];
  /** Every other text the writer saw: evidence, brand context, the idea, unsourced proof, the ICP. */
  knownText: string[];
  /** The idea's supplied sources (market signals): a claim they state is sourced to them. */
  sources?: { title?: string; text?: string; url?: string }[];
}

export interface DraftCheckResult {
  /** The body to save: the edit, with over-long paragraphs split in code. */
  body: string;
  claims_ok: ClaimsOk;
  claims: CheckedClaim[];
  /** Why the draft is BLOCKED or needs review. */
  reasons: string[];
  /** Advisory notes for the reviewer (readability). Never block. */
  review_notes: string[];
  readability: Readability;
}

const FIRST_PERSON_EXPERIENCE =
  /\b(?:we|I)\s+(?:built|tested|saw|found|ran|worked|helped|learned|watched|launched|shipped|audited|fixed|wired|deployed|noticed)\b|\bour (?:clients?|customers?)\b|\bone of our\b|\bwhen we\b/i;

/** A year is a date, not a statistic. */
const isYear = (n: string) => /^\d{4}$/.test(n) && Number(n) >= 1950 && Number(n) <= 2100;

function matches(claim: string, source: string): boolean {
  const shared = sharedWords(claim, source);
  return shared >= 3 && numbersIn(claim).every((n) => numbersIn(source).includes(n));
}

export function checkDraft(input: DraftCheckInput): DraftCheckResult {
  const body = reflowParagraphs(input.body);
  const text = `${input.hook}\n${body}`;
  const sources = (input.sources ?? []).filter((s) => s.url && `${s.title ?? ""}${s.text ?? ""}`.trim());
  const lived = input.trustBasis.includes("LIVED_EXPERIENCE");
  const publicMemory = input.memory.filter((m) => m.disclosure !== "GENERALIZE").map((m) => m.content);
  const blocked: string[] = [];
  const review: string[] = [];

  const claims: CheckedClaim[] = input.claims.map((c) => {
    const claim_text = String(c.claim_text ?? "").trim();
    const claim_type = String(c.claim_type ?? "OPINION").toUpperCase();
    if (claim_type === "OPINION") return { claim_text, claim_type, source_url: "", source_title: "", verified: "NA" };
    const proof = input.approvedProofs.find((p) => matches(claim_text, p.claim));
    const fromMemory = lived && publicMemory.some((m) => matches(claim_text, m));
    // A market claim a supplied source states is sourced to it; a customer result never is.
    const source = claim_type !== "CUSTOMER_RESULT" && !proof && !fromMemory ? sources.find((s) => matches(claim_text, `${s.title ?? ""} ${s.text ?? ""}`)) : undefined;
    if (claim_type === "CUSTOMER_RESULT" && !fromMemory && !(input.allowCustomerResult && proof)) {
      blocked.push(`Customer result with no approved proof or experience item behind it: "${claim_text.slice(0, 120)}"`);
    } else if (!proof && !fromMemory && !source) {
      review.push(`Unbacked ${claim_type.toLowerCase().replace("_", " ")}: "${claim_text.slice(0, 120)}"`);
    }
    return {
      claim_text,
      claim_type,
      source_url: proof?.sourceUrl ?? source?.url ?? "",
      source_title: proof ? proof.sourceTitle || new URL(proof.sourceUrl).hostname : fromMemory ? "The author's own experience" : source ? source.title || "Supplied source" : "",
      verified: proof || fromMemory || source ? "Y" : "N",
    };
  });

  const known = [...publicMemory, ...input.memory.map((m) => m.generalizedContent ?? ""), ...input.approvedProofs.map((p) => p.claim), ...input.knownText];
  const invented = unsupportedNumbers(text, known).filter((n) => !isYear(n));
  if (invented.length) blocked.push(`States figures found in no input: ${invented.join(", ")}.`);

  for (const m of input.memory.filter((x) => x.disclosure === "GENERALIZE")) {
    const leaked = leakedSpecifics(m.content, text);
    if (leaked.length) blocked.push(`Uses specifics from a Generalize experience item: ${leaked.join(", ")}.`);
  }

  if (!lived && !input.trustBasis.includes("USER_NOTE")) {
    const hit = text.match(FIRST_PERSON_EXPERIENCE);
    if (hit) review.push(`Claims first-person experience ("${hit[0]}") with no experience item behind this idea.`);
  }

  const readability = measure(input.hook, body);
  const claims_ok: ClaimsOk = blocked.length ? "BLOCKED" : review.length ? "N" : "Y";
  return { body, claims_ok, claims, reasons: [...blocked, ...review], review_notes: readabilityIssues(readability), readability };
}
