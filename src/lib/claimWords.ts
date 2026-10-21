/**
 * Two ways a retelling says more than its source without adding a digit or a
 * name, so the figure and name checks miss them:
 *
 *  - An upgraded verb: the site says "we offer a demo", the item says "I
 *    engineered a demo". Achievement verbs credit the author with something,
 *    so each one must be in the source in some form.
 *  - A figure written out in words: "by day seven", "three weeks later". Each
 *    counted unit must match a number the source states, in digits or words.
 *
 * Used by the brand import (src/lib/brandImport/check.ts), which drops an item
 * that does either, and by the draft check (src/lib/drafts/check.ts), which
 * sends such a draft to review.
 */

/**
 * Achievement verbs (past tense, as a retelling uses them) -> the stems that back them in a source.
 * Verbs that are mostly idiom ("ran into", "closed the laptop", "drove to") are left out.
 */
const ACHIEVEMENT_VERBS: Record<string, string[]> = {
  built: ["build", "built"],
  engineered: ["engineer"],
  architected: ["architect"],
  designed: ["design"],
  created: ["creat"],
  developed: ["develop"],
  invented: ["invent"],
  pioneered: ["pioneer"],
  launched: ["launch"],
  founded: ["found", "co-found", "cofound"],
  led: ["led", "lead"],
  spearheaded: ["spearhead"],
  managed: ["manag"],
  scaled: ["scal"],
  grew: ["grew", "grow"],
  transformed: ["transform"],
  delivered: ["deliver"],
  shipped: ["ship"],
  implemented: ["implement"],
  automated: ["automat"],
  won: ["won", "win"],
  doubled: ["doubl"],
  tripled: ["tripl"],
};

const VERB_ALTERNATION = Object.keys(ACHIEVEMENT_VERBS).join("|");
/** "I built", "we personally designed", "I've led", "I helped design" is not matched (helping is not leading). */
const CLAIMED_VERB = new RegExp(`\\b(?:I|we)(?:'ve|’ve|\\s+have|\\s+had)?\\s+(?:\\w+ly\\s+)?(${VERB_ALTERNATION})\\b`, "gi");

/** Achievement verbs the author is credited with in `text` that `source` never uses, in any form. */
export function overstatedVerbs(text: string, source: string): string[] {
  const src = source.toLowerCase();
  const out = new Set<string>();
  for (const m of text.matchAll(CLAIMED_VERB)) {
    const verb = m[1].toLowerCase();
    if (!ACHIEVEMENT_VERBS[verb].some((stem) => new RegExp(`\\b${stem}`).test(src))) out.add(m[0]);
  }
  return Array.from(out);
}

const NUMBER_WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};
const WORD_ALTERNATION = Object.keys(NUMBER_WORDS).join("|");

/** Units that make a number a fact about what happened, not structure ("two things", "three steps" stay free). */
const UNITS = "minutes?|hours?|days?|weeks?|months?|years?|people|clients?|customers?|teams?|calls?|leads?|deals?|hires?|employees?|staff|percent|times";
const NUMBER = `\\d+(?:[.,]\\d+)?|${WORD_ALTERNATION}`;

// "seven days", "ten-day", "10 days", and "day seven" / "week 3".
const counted = (number: string) => new RegExp(`\\b(${number})[\\s-]+(${UNITS})\\b|\\b(day|week|month|year|hour)\\s+(${number})\\b`, "gi");

const toNumber = (n: string) => NUMBER_WORDS[n.toLowerCase()] ?? Number(n.replace(",", "."));
const unitOf = (u: string) => u.toLowerCase().replace(/s$/, "");

/** "7:day" for every counted unit a text states, in digits or words. */
function countedFigures(text: string, number: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of text.matchAll(counted(number))) {
    const key = m[1] ? `${toNumber(m[1])}:${unitOf(m[2])}` : `${toNumber(m[4])}:${unitOf(m[3])}`;
    out.set(key, m[0]);
  }
  return out;
}

/**
 * Figures `text` writes out in words ("by day seven", "three weeks later") that
 * `source` never states with the same unit. "Three days" in the source does
 * not back "three weeks".
 */
export function unsupportedSpelledFigures(text: string, source: string): string[] {
  const known = countedFigures(source, NUMBER);
  return Array.from(countedFigures(text, WORD_ALTERNATION))
    .filter(([key]) => !known.has(key))
    .map(([, phrase]) => phrase);
}
