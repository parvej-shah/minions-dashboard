import { contentWords, numbersIn, sharedWords, unsupportedNumbers } from "@/lib/harvest/text";
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
 *  - A retold experience item gained details it never stated ("No new
 *    logo."), an outcome ("The result? More discovery calls."), or became a
 *    pattern ("I've stopped clients…", "hundreds of sites"). Each needs review.
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
  /** What the author says about their own work beyond the idea's items: positioning, proof claims without a source. */
  authorFacts?: string[];
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

export const FIRST_PERSON_EXPERIENCE =
  /\b(?:we|I)\s+(?:built|tested|saw|found|ran|worked|helped|learned|watched|launched|shipped|audited|fixed|wired|deployed|noticed)\b|\bour (?:clients?|customers?)\b|\bone of our\b|\bwhen we\b/i;

/** A stated outcome: "The result? …", "resulted in", "doubled". */
const RESULT_STATEMENT = /\bthe results?(?:\s+(?:was|were))?\s*[?:]|\bresulted in\b|\b(?:doubled|tripled|quadrupled)\b/i;

/** One case told as many: "I've stopped clients…", "we have helped founders…". */
const PLURAL_EXPERIENCE = /\b(?:I|we)(?:'ve|’ve|\s+have)\s+(?:\w+\s+){0,2}?(clients|customers|founders|coaches|businesses|companies|brands|teams)\b/gi;

/** An outcome that claims a gain, as opposed to a consequence ("The result: stale leads pile up"). */
const GAIN = /\b(?:more|higher|fewer|lower|stronger|better|faster|increased?|grew|jump(?:ed)?|boost(?:ed)?|lift(?:ed)?)\b/i;

/** The author speaking about their own work. */
const FIRST_PERSON = /\b(?:I|I'?ve|I’ve|we|we'?ve|we’ve|my|our|me|us)\b/i;

/** A count said in words, which the figure check cannot see. */
const VAGUE_COUNT = /\b(?:hundreds|dozens|thousands)\s+of\s+\w+/gi;

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean);

/** Share of a sentence's content words that appear in the best-matching source. */
function coverage(sentence: string, sources: string[]): number {
  const words = contentWords(sentence);
  if (!words.size) return 1;
  let best = 0;
  for (const src of sources) {
    const known = contentWords(src);
    let n = 0;
    for (const w of words) if (known.has(w)) n++;
    best = Math.max(best, n / words.size);
  }
  return best;
}

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
  // A note the author wrote is their experience too, when it is among the items.
  const lived = input.trustBasis.includes("LIVED_EXPERIENCE") || (input.trustBasis.includes("USER_NOTE") && input.memory.length > 0);
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
    } else if (fromMemory && !proof) {
      // Backed by an item as a whole, but a sentence with nothing from any item was added in the retelling.
      const added = sentencesOf(claim_text).filter((x) => contentWords(x).size >= 2 && coverage(x, publicMemory) === 0);
      if (added.length) review.push(`Adds details the experience item does not state: "${added.join(" ").slice(0, 120)}"`);
    }
    return {
      claim_text,
      claim_type,
      source_url: proof?.sourceUrl ?? source?.url ?? "",
      source_title: proof ? proof.sourceTitle || new URL(proof.sourceUrl).hostname : fromMemory ? "The author's own experience" : source ? source.title || "Supplied source" : "",
      verified: proof || fromMemory || source ? "Y" : "N",
    };
  });

  const known = [...publicMemory, ...input.memory.map((m) => m.generalizedContent ?? ""), ...input.approvedProofs.map((p) => p.claim), ...(input.authorFacts ?? []), ...input.knownText];
  const invented = unsupportedNumbers(text, known).filter((n) => !isYear(n));
  if (invented.length) blocked.push(`States figures found in no input: ${invented.join(", ")}.`);

  for (const m of input.memory.filter((x) => x.disclosure === "GENERALIZE")) {
    const leaked = leakedSpecifics(m.content, text);
    if (leaked.length) blocked.push(`Uses specifics from a Generalize experience item: ${leaked.join(", ")}.`);
  }

  // What the author's own work may be described with: their items and their proof claims, never the idea's paraphrase.
  const authorText = [...publicMemory, ...input.approvedProofs.map((p) => p.claim), ...(input.authorFacts ?? [])];
  const authorWords = contentWords(authorText.join(" "));
  const proofText = [...publicMemory, ...input.approvedProofs.map((p) => p.claim)];
  // Only a draft built on the author's experience can report an outcome of it.
  const sentences = lived ? sentencesOf(text) : [];
  sentences.forEach((sentence, i) => {
    const result = sentence.match(RESULT_STATEMENT);
    if (!result) return;
    // The words after the marker are the outcome ("The result? …" puts it in the next sentence);
    // a gain in it must mostly come from an item or a proof.
    const outcome = sentence.slice((result.index ?? 0) + result[0].length).trim() || (sentences[i + 1] ?? "");
    if (GAIN.test(outcome) && coverage(outcome, proofText) < 0.6) review.push(`States an outcome no experience item or proof gives: "${`${sentence} ${outcome}`.slice(0, 120)}"`);
  });
  for (const m of text.matchAll(PLURAL_EXPERIENCE)) {
    if (!Array.from(contentWords(m[1])).some((w) => authorWords.has(w))) {
      review.push(`Describes one experience as many ("${m[0]}"); no item says it happened with ${m[1].toLowerCase()}.`);
    }
  }
  const authorLower = authorText.join(" ").toLowerCase();
  // "Hundreds of records" in general is fine; "I've audited hundreds of sites" is a claim about the author.
  for (const sentence of sentencesOf(text).filter((x) => FIRST_PERSON.test(x))) {
    for (const m of sentence.matchAll(VAGUE_COUNT)) {
      if (!authorLower.includes(m[0].toLowerCase())) review.push(`States a count no item gives: "${m[0]}".`);
    }
  }

  if (!lived && !input.trustBasis.includes("USER_NOTE")) {
    const hit = text.match(FIRST_PERSON_EXPERIENCE);
    if (hit) review.push(`Claims first-person experience ("${hit[0]}") with no experience item behind this idea.`);
  }

  const readability = measure(input.hook, body);
  const claims_ok: ClaimsOk = blocked.length ? "BLOCKED" : review.length ? "N" : "Y";
  return { body, claims_ok, claims, reasons: [...blocked, ...review], review_notes: readabilityIssues(readability), readability };
}
