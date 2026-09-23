/**
 * Plain-text checks shared by the idea gate (src/lib/harvest/gate.ts) and the
 * eval rubric (src/test/eval/rubric.ts). They decide whether an idea really
 * uses an item it cites and whether it states a figure no input supports, so
 * both places must count words and numbers the same way.
 */

export const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();

const STOPWORDS = new Set(
  "a an the and or but if of to in on at by for with from into over under about as is are was were be been being it its this that these those their there they them our we you your he she his her not no than then so such can will would should could may might do does did have has had just only more most very what when where which who why how all any each every other some own same too up out".split(" ")
);

/** Content words (lowercased, no stopwords, length >= 3), crudely stemmed. */
export function contentWords(text: string): Set<string> {
  return new Set(
    norm(text)
      .split(" ")
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
      .map((w) => w.replace(/(ing|ed|es|s)$/, ""))
  );
}

/** How many content words two texts share. */
export function sharedWords(a: string, b: string): number {
  const wa = contentWords(a);
  let n = 0;
  for (const w of contentWords(b)) if (wa.has(w)) n++;
  return n;
}

/** Every number in a text, normalised ("47 days" -> "47", "2,5" -> "2.5"). */
export function numbersIn(text: string): string[] {
  return Array.from(new Set((text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."))));
}

/**
 * A number that states a fact rather than counts steps: anything with a %, or
 * any number from 10 up. "3 questions" or "2 steps" is structure, not a claim.
 */
export function isFactualNumber(n: string, text: string): boolean {
  return Number(n) >= 10 || new RegExp(`\\b${n.replace(".", "\\.")}\\s*%`).test(text);
}

/** Factual numbers in `text` that appear nowhere in `sources`. */
export function unsupportedNumbers(text: string, sources: string[]): string[] {
  const known = new Set(numbersIn(sources.join(" ")));
  return numbersIn(text).filter((n) => isFactualNumber(n, text) && !known.has(n));
}
