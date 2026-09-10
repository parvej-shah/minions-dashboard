/**
 * Thesis fingerprinting for cross-run idea dedupe.
 *
 * The harvester's original dedupe compared raw word overlap (Jaccard > 0.45)
 * against stored ideas. That only catches near-verbatim wording -- two ideas
 * making the identical argument in different words passed straight through,
 * which is why the stream filled with restatements of the same claim.
 *
 * A thesis key strips filler and keeps the distinctive terms of the claim,
 * sorted, so "Most HVAC firms overspend on dispatch software" and
 * "Dispatch software is where HVAC companies overspend" collapse to the same
 * key. Cheap, deterministic, and no embedding service required.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "but", "not",
  "how", "why", "what", "when", "who", "into", "than", "then", "them", "they", "their",
  "have", "has", "had", "was", "were", "will", "would", "can", "could", "should", "its",
  "it's", "about", "more", "most", "much", "many", "some", "any", "all", "one", "two",
  "get", "gets", "got", "make", "makes", "made", "use", "uses", "using", "used", "way",
  "ways", "new", "old", "big", "small", "good", "bad", "best", "worst", "just", "only",
  "even", "also", "very", "really", "actually", "still", "here", "there", "where",
  "which", "while", "because", "before", "after", "over", "under", "between", "through",
  "why's", "isn't", "doesn't", "don't", "won't", "can't",
]);

/** Words that carry no distinguishing weight in B2B content ideas. */
const DOMAIN_FILLER = new Set([
  "business", "company", "companies", "team", "teams", "customer", "customers",
  "content", "post", "article", "guide", "tips", "strategy", "strategies",
  "solution", "solutions", "platform", "tool", "tools", "system", "systems",
  "process", "processes", "approach", "leaders", "leader", "owners", "owner",
]);

/**
 * Crude suffix stemmer. Without it, "reshape"/"reshapes" and
 * "regulation"/"regulate" count as unrelated tokens, and a paraphrase that
 * only changes word forms scores far below the redundancy threshold -- which
 * is exactly the kind of restatement this is meant to catch. Deliberately
 * conservative: it only strips endings that rarely change meaning.
 */
function stem(word: string): string {
  let base = word;
  for (const suffix of ["ations", "ation", "ements", "ement", "ings", "ing", "ers", "er", "ies", "ied", "es", "ed", "s"]) {
    if (base.length > suffix.length + 3 && base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      if (base.endsWith("i")) base = base.slice(0, -1) + "y";
      break;
    }
  }
  // "reshape" and "reshapes" must land on one form: the first strips nothing,
  // the second strips "es" to "reshap". Dropping a trailing bare "e" makes
  // both "reshap", which is what matters -- these keys are only ever compared
  // to each other, never shown to anyone.
  if (base.length > 4 && base.endsWith("e")) base = base.slice(0, -1);
  return base;
}

export function normalizeTokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter((w) => w.length > 3 && !STOPWORDS.has(w) && !DOMAIN_FILLER.has(w))
    .map(stem);
}

/**
 * A stable fingerprint of an idea's claim. Keeps the 8 most distinctive
 * tokens, sorted so word order can't produce two keys for one argument.
 */
export function thesisKey(...parts: (string | null | undefined)[]): string {
  const tokens = normalizeTokens(parts.filter(Boolean).join(" "));
  const unique = Array.from(new Set(tokens)).sort();
  return unique.slice(0, 8).join("-");
}

/**
 * Re-stems an already-stored key. Keys written before the stemmer existed
 * hold unstemmed tokens ("software", "firms"); without this they silently
 * stop matching freshly-computed candidates and old ideas start repeating.
 */
export function restemKey(key: string): string {
  return Array.from(new Set(key.split("-").filter(Boolean).map(stem))).sort().join("-");
}

/** Jaccard overlap of two token sets, 0..1. */
export function tokenOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared++;
  return shared / (setA.size + setB.size - shared);
}

/**
 * True when `candidate` restates something already in `existing`.
 *
 * Two gates, because they catch different failures: an identical thesis key
 * means the same distinctive terms in any order, while the overlap threshold
 * catches paraphrases that share most-but-not-all of those terms.
 */
export function isRedundantThesis(
  candidate: { rawIdea?: string | null; angle?: string | null },
  existing: { thesisKey?: string | null; rawIdea?: string | null; angle?: string | null }[],
  overlapThreshold = 0.5
): boolean {
  const candKey = thesisKey(candidate.rawIdea, candidate.angle);
  if (!candKey) return false;
  const candTokens = candKey.split("-");

  for (const row of existing) {
    const rowKey = row.thesisKey ? restemKey(row.thesisKey) : thesisKey(row.rawIdea, row.angle);
    if (!rowKey) continue;
    if (rowKey === candKey) return true;
    if (tokenOverlap(candTokens, rowKey.split("-")) >= overlapThreshold) return true;
  }
  return false;
}
