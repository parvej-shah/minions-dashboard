/**
 * Banned words: a brand's FORBIDDEN directives, found and repaired in code.
 *
 * The writer only sees the list as one line of brand context, and models do
 * not reliably honour it, so a draft often came back BLOCKED over a single
 * word ("deterministic"). Now the sentences that use one are rewritten by a
 * small model call (src/services/bannedScrub.ts) and each rewrite is checked
 * here before it replaces anything. Prepare Asset Row still scans the result,
 * so a word the repair could not remove still blocks the draft.
 */

/** The same match rule as 02's Prepare Asset Row gate: whole words, any case. */
function containsPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  if (/[a-zA-Z0-9]/.test(phrase)) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  }
  return text.includes(phrase);
}

export function bannedHits(text: string, phrases: string[]): string[] {
  return phrases.filter((p) => containsPhrase(text, p));
}

/**
 * A FORBIDDEN directive's text is either a word or phrase ("seamless") or a
 * whole rule ("Never mention, promise, or discuss ..."). Only the first kind
 * can be matched in a draft; the gate would never find a rule verbatim.
 */
export function isBannedPhrase(instruction: string): boolean {
  const s = instruction.trim();
  return Boolean(s) && s.split(/\s+/).length <= 4 && !/[.:!?"]/.test(s);
}

export function bannedPhrases(instructions: string[]): string[] {
  return Array.from(new Set(instructions.map((s) => s.trim()).filter(isBannedPhrase)));
}

/** Sentences of a text, each exactly as it appears, so it can be replaced in place. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Headings, images and list markers stay whole lines.
    if (/^(#{1,6}\s|!\[|[-*]\s|\d+\.\s)/.test(trimmed)) {
      out.push(trimmed);
      continue;
    }
    const parts = trimmed.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) ?? [trimmed];
    for (const p of parts) if (p.trim()) out.push(p.trim());
  }
  return out;
}

/** Every distinct sentence, across the texts, that uses a banned phrase. */
export function offendingSentences(texts: string[], phrases: string[]): string[] {
  const found = new Set<string>();
  for (const t of texts) for (const s of sentences(t)) if (bannedHits(s, phrases).length) found.add(s);
  return Array.from(found);
}

const digits = (s: string) => new Set(s.match(/\d+(?:[.,]\d+)?/g) ?? []);

/**
 * Whether a rewrite may replace its sentence: the banned words are gone, no
 * figure was added, and it is still the same sentence in size. Anything else
 * leaves the original, and the gate blocks the draft as before.
 */
export function acceptRewrite(original: string, rewrite: string, phrases: string[]): string | null {
  const r = rewrite.trim();
  if (!r || bannedHits(r, phrases).length) return "still uses a banned word";
  const had = digits(original);
  for (const d of digits(r)) if (!had.has(d)) return `adds the figure ${d}`;
  if (r.length < original.length * 0.5 || r.length > original.length * 1.8 + 20) return "changes the sentence's length too much";
  if (/—|--/.test(r) && !/—|--/.test(original)) return "adds an em dash";
  // A heading must stay a heading of the same level, and a plain line plain.
  const marker = (s: string) => s.match(/^(#{1,6}\s|!\[|[-*]\s|\d+\.\s)/)?.[0].trim() ?? "";
  if (marker(original) !== marker(r)) return "changes the line's markdown";
  return null;
}

/** The text with each accepted sentence replaced, wherever it occurs. */
export function applyRewrites(text: string, rewrites: Map<string, string>): string {
  let out = text;
  for (const [from, to] of rewrites) out = out.split(from).join(to);
  return out;
}
