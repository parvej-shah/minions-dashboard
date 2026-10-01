/**
 * The draft check (check.ts, readability.ts, the below-bar label and the
 * banned-word pass) writes review notes for an editor. A reviewer deciding
 * whether to post needs the same facts in plain words: what is wrong, and
 * what to do about it. Unknown notes pass through unchanged.
 */

export type PlainNoteTone = "fix" | "check" | "tip";

export interface PlainNote {
  tone: PlainNoteTone;
  text: string;
}

const RULES: { re: RegExp; tone: PlainNoteTone; say: (m: RegExpMatchArray) => string }[] = [
  {
    re: /^Below the usual bar: (.+?)\. Chosen because/,
    tone: "fix",
    say: (m) => `This one is weaker than usual (${m[1]}). Add a real example from your work to make it yours.`,
  },
  {
    re: /^Customer result with no approved proof or experience item behind it: "(.+)"$/,
    tone: "fix",
    say: (m) => `Mentions a customer result you haven't told us about: "${m[1]}". Keep it only if it's true.`,
  },
  { re: /^States figures found in no input: (.+)\.$/, tone: "fix", say: (m) => `These numbers didn't come from you: ${m[1]}. Remove them, or keep them if they're right.` },
  { re: /^Uses specifics from a Generalize experience item: (.+)\.$/, tone: "fix", say: (m) => `Uses details you asked to keep general: ${m[1]}.` },
  { re: /^Uses banned words: (.+)$/, tone: "fix", say: (m) => `Uses words you asked us to avoid: ${m[1]}.` },
  { re: /^Unbacked [a-z ]+: "(.+)"$/, tone: "check", say: (m) => `Make sure this is true: "${m[1]}"` },
  { re: /^Adds details the experience item does not state: "(.+)"$/, tone: "check", say: (m) => `Adds details you didn't give us: "${m[1]}"` },
  { re: /^States an outcome no experience item or proof gives: "(.+)"$/, tone: "check", say: (m) => `Claims a result you didn't mention: "${m[1]}"` },
  { re: /^Describes one experience as many \("(.+?)"\)/, tone: "check", say: (m) => `Makes one experience sound like many ("${m[1]}").` },
  { re: /^States a count no item gives: "(.+)"\.$/, tone: "check", say: (m) => `Gives a number you didn't give us: "${m[1]}".` },
  {
    re: /^Claims first-person experience \("(.+?)"\) with no experience item/,
    tone: "check",
    say: (m) => `Speaks as if you did this yourself ("${m[1]}"). Keep it only if you did.`,
  },
  { re: /^The hook is \d+ characters; LinkedIn hides everything after about (\d+)\.$/, tone: "tip", say: (m) => `The opening runs past the "see more" cut (about ${m[1]} characters). Shorter openings get read.` },
  { re: /^(\d+) paragraph\(s\) run over \d+ sentences\.$/, tone: "tip", say: (m) => `${m[1]} paragraph${m[1] === "1" ? " is" : "s are"} long for a phone screen. Break ${m[1] === "1" ? "it" : "them"} up.` },
  { re: /^(\d+) sentence\(s\) run over \d+ words\.$/, tone: "tip", say: (m) => `${m[1]} sentence${m[1] === "1" ? " is" : "s are"} long. Shorter ones read faster.` },
  { re: /^Reworded \d+ sentences? to avoid banned words$/, tone: "tip", say: () => "We reworded a few lines to avoid words you don't use." },
];

const ORDER: Record<PlainNoteTone, number> = { fix: 0, check: 1, tip: 2 };

export function plainNote(note: string): PlainNote {
  for (const rule of RULES) {
    const m = note.match(rule.re);
    if (m) return { tone: rule.tone, text: rule.say(m) };
  }
  return { tone: "check", text: note };
}

/**
 * Everything a reviewer should know before posting, most serious first.
 * A draft whose facts are still unapproved says so even without notes.
 */
export function plainReviewNotes(asset: { review_notes: string[]; claims_ok: string | null }): PlainNote[] {
  const notes = asset.review_notes.map(plainNote);
  const blocked = asset.claims_ok !== null && asset.claims_ok !== "Y";
  if (blocked && !notes.some((n) => n.tone !== "tip")) {
    notes.push({ tone: "check", text: "Some facts in this post need your OK before it goes out." });
  }
  return notes.sort((a, b) => ORDER[a.tone] - ORDER[b.tone]);
}
