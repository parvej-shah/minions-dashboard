/**
 * Brevity and mobile readability, measured in code (phase 4 of
 * docs/product/authority-flywheel-plan.md). Used by the draft check that
 * gates every draft, and by the draft eval.
 */

/** LinkedIn cuts a post at about 210 characters behind "see more"; the hook must land before that. */
const HOOK_MAX_CHARS = 210;
/** A mobile paragraph: at most this many sentences. */
const PARAGRAPH_MAX_SENTENCES = 3;
/** A sentence a phone reader can take in one pass. */
const SENTENCE_MAX_WORDS = 30;

export interface Readability {
  words: number;
  hook_chars: number;
  headings: number;
  paragraphs: number;
  /** Paragraphs over PARAGRAPH_MAX_SENTENCES. */
  long_paragraphs: number;
  avg_sentence_words: number;
  /** Sentences over SENTENCE_MAX_WORDS. */
  long_sentences: number;
}

const sentencesOf = (p: string) =>
  p
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => /[a-z0-9]/i.test(s));
const wordsOf = (s: string) => s.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));

export function measure(hook: string, body: string): Readability {
  // A heading often sits directly above its paragraph with a single newline.
  const headings: string[] = [];
  const paragraphs: string[] = [];
  for (const block of body.split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    headings.push(...lines.filter((l) => /^#{1,6}\s/.test(l)));
    const text = lines.filter((l) => !/^#{1,6}\s/.test(l)).join(" ");
    if (text) paragraphs.push(text);
  }
  const sentences = paragraphs.flatMap(sentencesOf);
  const words = wordsOf(body.replace(/^#{1,6}\s.*$/gm, "")).length;
  return {
    words,
    hook_chars: hook.trim().length,
    headings: headings.length,
    paragraphs: paragraphs.length,
    long_paragraphs: paragraphs.filter((p) => sentencesOf(p).length > PARAGRAPH_MAX_SENTENCES).length,
    avg_sentence_words: sentences.length ? Math.round((10 * sentences.reduce((n, s) => n + wordsOf(s).length, 0)) / sentences.length) / 10 : 0,
    long_sentences: sentences.filter((s) => wordsOf(s).length > SENTENCE_MAX_WORDS).length,
  };
}

/** What a reviewer should fix, in plain words. Empty when the draft reads well on a phone. */
export function readabilityIssues(r: Readability): string[] {
  const out: string[] = [];
  if (r.hook_chars > HOOK_MAX_CHARS) out.push(`The hook is ${r.hook_chars} characters; LinkedIn hides everything after about ${HOOK_MAX_CHARS}.`);
  if (r.long_paragraphs) out.push(`${r.long_paragraphs} paragraph(s) run over ${PARAGRAPH_MAX_SENTENCES} sentences.`);
  if (r.long_sentences) out.push(`${r.long_sentences} sentence(s) run over ${SENTENCE_MAX_WORDS} words.`);
  return out;
}

/** A sentence this short belongs with its neighbours ("No alert. No retry."). */
const FRAGMENT_WORDS = 4;

/**
 * Groups sentences into paragraphs of at most PARAGRAPH_MAX_SENTENCES, with
 * as few breaks as possible, never inside a run of short fragments when it
 * can be avoided.
 */
function splitSentences(sentences: string[]): string[][] {
  const n = sentences.length;
  const short = (i: number) => wordsOf(sentences[i]).length <= FRAGMENT_WORDS;
  // Breaking inside a run of fragments ("No alert. | No retry.") breaks its rhythm.
  const breakCost = (i: number) => 1 + (short(i) && short(i - 1) ? 10 : 0);
  // best[i]: cheapest grouping of sentences[i..]; each group is 1-3 sentences.
  const best: { cost: number; size: number }[] = Array(n + 1).fill(null).map(() => ({ cost: Infinity, size: 0 }));
  best[n] = { cost: 0, size: 0 };
  for (let i = n - 1; i >= 0; i--) {
    for (let size = 1; size <= PARAGRAPH_MAX_SENTENCES && i + size <= n; size++) {
      const next = i + size;
      const cost = best[next].cost + (next < n ? breakCost(next) : 0) + (size === 1 ? 0.5 : 0);
      if (cost < best[i].cost) best[i] = { cost, size };
    }
  }
  const groups: string[][] = [];
  for (let i = 0; i < n; i += best[i].size) groups.push(sentences.slice(i, i + best[i].size));
  return groups;
}

/**
 * Splits every paragraph over PARAGRAPH_MAX_SENTENCES (see splitSentences). The writer and editor are told the limit
 * and still break it on about one paragraph in three; a break between two
 * sentences changes no wording, so code enforces it. Headings and lists are
 * left alone.
 */
export function reflowParagraphs(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n");
      const isProse = (l: string) => l.trim() && !/^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>)/.test(l);
      if (lines.filter((l) => l.trim()).length !== lines.filter(isProse).length + lines.filter((l) => /^#{1,6}\s/.test(l.trim())).length) return block;
      const head = lines.filter((l) => /^#{1,6}\s/.test(l.trim()));
      const prose = lines.filter(isProse).join(" ").trim();
      if (!prose) return block;
      const sentences = sentencesOf(prose);
      if (sentences.length <= PARAGRAPH_MAX_SENTENCES) return block;
      const parts = splitSentences(sentences).map((g) => g.join(" "));
      return [...(head.length ? [head.join("\n") + "\n" + parts[0]] : [parts[0]]), ...parts.slice(1)].join("\n\n");
    })
    .join("\n\n");
}
