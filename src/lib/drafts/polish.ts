import { FIRST_PERSON_EXPERIENCE } from "./check";

/**
 * Whether a whole-draft rewrite (src/services/draftPolish.ts) may replace the
 * draft. It may only change how things are said: the same figures, hashtags
 * and headings, about the same length, and no experience the author did not
 * have. Returns the reason it may not, or null.
 */
export function rejectPolish(original: string, rewrite: string): string | null {
  const r = rewrite.trim();
  if (!r) return "came back empty";
  const set = (s: string, re: RegExp) => new Set((s.match(re) ?? []).map((x) => x.toLowerCase()));
  const figures = /\d+(?:[.,]\d+)*/g;
  const had = set(original, figures);
  for (const d of set(r, figures)) if (!had.has(d)) return `adds the figure ${d}`;
  for (const d of had) if (!set(r, figures).has(d)) return `drops the figure ${d}`;
  const tags = /(?:^|\s)#\w+/g;
  const [a, b] = [set(original, tags), set(r, tags)];
  if (a.size !== b.size || [...a].some((t) => !b.has(t))) return "changes the hashtags";
  // The rewrite's em dashes become commas (draftPolish), so a heading is compared without them.
  const headings = (s: string) => (s.match(/^#{1,6}\s.*$/gm) ?? []).map((h) => h.replace(/\s*(?:—|--)\s*/g, ", ").trim()).join("\n");
  if (headings(original) !== headings(r)) return "changes the headings";
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  const ratio = words(r) / Math.max(1, words(original));
  if (ratio < 0.75 || ratio > 1.3) return "changes the length too much";
  if (/—|--/.test(r) && !/—|--/.test(original)) return "adds an em dash";
  if (FIRST_PERSON_EXPERIENCE.test(r) && !FIRST_PERSON_EXPERIENCE.test(original)) return "adds first-person experience";
  if (/\b(?:we|our|us)\b/i.test(r) && !/\b(?:we|our|us)\b/i.test(original)) return "speaks as 'we' where the draft did not";
  return null;
}
