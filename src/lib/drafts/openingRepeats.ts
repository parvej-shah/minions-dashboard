/**
 * Whether a post's first or last line repeats one of the workspace's recent
 * posts (task 113 phase 3). Prompts alone don't stop it, as slop.ts already
 * learned, so the code checks. Pure: draftPolish feeds it the recent lines.
 * Returns the reason it repeats, or null.
 */

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

const trigrams = (w: string[]) => new Set(w.slice(0, -2).map((_, i) => w.slice(i, i + 3).join(" ")));

/** Openings that read as one template whatever nouns fill them. */
const TEMPLATES: RegExp[] = [
  /^most\b/,
  /^last (?:week|month|year|quarter|night|time|spring|summer|fall|winter)\b/,
  /^here(?:'s| is| are)\b/,
  /^imagine\b/,
  /^what if\b/,
  /^(?:ever|have you ever)\b/,
  /^every (?:time|day|week)\b/,
  /^the (?:real|biggest|hardest|hard) (?:problem|part|question|lesson|truth)\b/,
];

/** A first word this many of the last five already used reads as a habit. */
const FIRST_WORD_LIMIT = 2;
const OVERLAP_MAX = 0.5;

export function lineRepeats(line: string, recent: string[]): string | null {
  const w = words(line);
  if (!w.length) return null;
  const rec = recent.map(words).filter((r) => r.length);
  const head = w.slice(0, 3).join(" ");
  const same3 = rec.find((r) => r.length >= 3 && w.length >= 3 && r.slice(0, 3).join(" ") === head);
  if (same3) return `same first three words as "${same3.join(" ")}"`;
  if (rec.slice(0, 5).filter((r) => r[0] === w[0]).length >= FIRST_WORD_LIMIT) return `the first word "${w[0]}" already opened ${FIRST_WORD_LIMIT} of the last five`;
  const t = trigrams(w);
  for (const r of rec) {
    const rt = trigrams(r);
    if (!t.size || !rt.size) continue;
    const shared = [...t].filter((g) => rt.has(g)).length;
    if (shared / (t.size + rt.size - shared) > OVERLAP_MAX) return `mostly the same words as "${r.join(" ")}"`;
  }
  const text = w.join(" ");
  const tpl = TEMPLATES.find((re) => re.test(text) && rec.some((r) => re.test(r.join(" "))));
  if (tpl) return "the same template as a recent post";
  return null;
}

/** The first paragraph of a post. */
export const firstParagraph = (text: string) => text.trim().split(/\n\s*\n/)[0]?.trim() ?? "";

/** The last paragraph of a post that is not just hashtags. */
export function lastParagraph(text: string): string {
  const paras = text.trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const prose = paras.filter((p) => !/^(?:#\w+\s*)+$/.test(p));
  return prose[prose.length - 1] ?? "";
}
