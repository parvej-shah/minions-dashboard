/**
 * How much of a draft its author rewrote before publishing: the share of words
 * not kept in order from the text Minions wrote (0 = untouched, 1 = all new).
 * Image lines (the cover) are not words the author wrote.
 */

const IMAGE_LINE = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/gm;
// Longer texts are cut so the comparison stays cheap; drafts are far shorter.
const MAX_WORDS = 4000;

export function words(text: string | null | undefined): string[] {
  return (text ?? "").replace(IMAGE_LINE, " ").split(/\s+/).filter(Boolean).slice(0, MAX_WORDS);
}

/** Longest common subsequence of two word lists, in two rows of memory. */
function keptInOrder(a: string[], b: string[]): number {
  let prev = new Array<number>(b.length + 1).fill(0);
  let row = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      row[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], row[j - 1]);
    }
    [prev, row] = [row, prev];
  }
  return prev[b.length];
}

export function editShare(first: string | null | undefined, final: string | null | undefined): number {
  const a = words(first);
  const b = words(final);
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 0;
  return 1 - keptInOrder(a, b) / longest;
}
