import { MEMORY_MIN_CHARS } from "@/constants/contentLanes";
import { parseIcpInput } from "@/lib/authorInput";
import { unsupported } from "@/lib/pulse/extract";
import { overstatedVerbs, unsupportedSpelledFigures } from "@/lib/claimWords";
import type { BrandVoiceQuestionnaire } from "@/types";
import type {
  ImportedExperience,
  ImportedExperienceKind,
  ImportedFocus,
  ImportedIcp,
  ImportedIdentity,
  ImportedProof,
  ImportedVoice,
} from "./types";

/**
 * Checks what the model read from a profile and website before the author
 * sees it. The model only proposes; code keeps an experience item or a proof
 * only when the source really says it: its quoted evidence must be in the
 * text, and it may not add a figure or a name the source lacks, write a
 * figure out in words the source never states, or credit the author with a
 * verb ("engineered", "led") the source never uses. A proof is
 * never more than a suggestion; it is saved only when the author ticks it.
 */

export const MAX_IMPORTED_EXPERIENCE = 10;
export const MAX_IMPORTED_PROOFS = 6;
const EXPERIENCE_MAX_CHARS = 600;
const MIN_QUOTE_CHARS = 12;
const ABOUT_MIN_CHARS = 40;
const ABOUT_MAX_CHARS = 4000;
const TOPIC_MAX = 5;

type Raw = Record<string, unknown>;

const obj = (value: unknown): Raw => (value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {});
const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const list = (value: unknown) => (Array.isArray(value) ? value : []);

/** Letters and digits only, so line breaks, hyphenation and punctuation from a PDF don't break a match. */
export function matchKey(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/** True when the source contains the quote, ignoring spacing, case and punctuation. */
export function quotedIn(source: string, quote: string): boolean {
  const key = matchKey(quote);
  return key.length >= MIN_QUOTE_CHARS && matchKey(source).includes(key);
}

/**
 * LinkedIn's PDF drops the About section's line breaks, gluing a sentence to
 * the next ("back in time.I'm", "between agentsBefore this") and a list item
 * to its arrow ("transcribe calls→ Missed"). Puts the breaks back. A name like
 * "Minions.AI" or "LinkedIn" stays whole: it needs a lowercase run before the
 * capital and a lowercase letter after it.
 */
export function unglue(value: string): string {
  return value
    .replace(/([a-z\d)][.!?])(?=[A-Z][a-z’']|I\s)/g, "$1\n")
    .replace(/(?<![#@\p{L}])([a-z]{3,})(?=[A-Z][a-z]{2,}\b)/gu, "$1\n")
    .replace(/[ \t]*→[ \t]*/g, "\n→ ");
}

/** Reads the model's JSON reply, tolerating code fences. Null when there is none. */
export function parseReply(content: string | null): Raw | null {
  if (!content) return null;
  try {
    const json = JSON.parse(content.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
    return json && typeof json === "object" && !Array.isArray(json) ? (json as Raw) : null;
  } catch {
    return null;
  }
}

export function checkIdentity(raw: unknown, source: string): ImportedIdentity | null {
  const r = obj(raw);
  const name = text(r.name, 80);
  // A name the source does not contain is a guess, and a guessed name is worse than none.
  if (matchKey(name).length < 3 || !matchKey(source).includes(matchKey(name))) return null;
  return { name, headline: text(r.headline, 220), company: text(r.company, 120) };
}

/** The longest cover sign-off line (the first-post screen's field allows the same). */
export const MAX_BYLINE = 90;

/**
 * The cover's line under the author's name, from their LinkedIn headline: its
 * first part, so "Founder at Acme | Building X for Y" signs off as "Founder at
 * Acme". Undefined when there is no headline or that part is still too long.
 */
export function bylineFromHeadline(headline: string | null | undefined): string | undefined {
  const first = (headline ?? "").split(/\s+[|•·–—]\s+/)[0]?.trim();
  return first && first.length <= MAX_BYLINE ? first : undefined;
}

export function checkFocus(raw: unknown): ImportedFocus | null {
  const r = obj(raw);
  const focus = text(r.focus, 400);
  if (focus.length < MEMORY_MIN_CHARS) return null;
  const topics = list(r.topics)
    .map((t) => text(t, 60))
    .filter(Boolean)
    .slice(0, TOPIC_MAX);
  return { focus, topics, industry: text(r.industry, 80) };
}

const CHOICES: { [K in Exclude<keyof BrandVoiceQuestionnaire, "signature_phrases">]: readonly BrandVoiceQuestionnaire[K][] } = {
  formality: ["casual", "balanced", "formal"],
  sentence_length: ["short", "mixed", "long"],
  humor: ["none", "light", "frequent"],
  emoji_use: ["never", "sometimes", "often"],
};

function choice<K extends keyof typeof CHOICES>(key: K, value: unknown, fallback: BrandVoiceQuestionnaire[K]): BrandVoiceQuestionnaire[K] {
  return (CHOICES[key] as readonly string[]).includes(String(value)) ? (value as BrandVoiceQuestionnaire[K]) : fallback;
}

/** The voice read from the author's own writing. Signature phrases and the About text must be theirs, word for word. */
export function checkVoice(raw: unknown, source: string): ImportedVoice | null {
  const r = obj(raw);
  const q = obj(r.questionnaire);
  // text() flattens line breaks, so unglue after it: the sample keeps its paragraphs.
  const about = unglue(text(r.about, ABOUT_MAX_CHARS));
  const questionnaire: BrandVoiceQuestionnaire = {
    formality: choice("formality", q.formality, "balanced"),
    sentence_length: choice("sentence_length", q.sentence_length, "mixed"),
    humor: choice("humor", q.humor, "light"),
    emoji_use: choice("emoji_use", q.emoji_use, "never"),
    signature_phrases: list(q.signature_phrases)
      .map((p) => text(p, 80))
      .filter((p) => p && quotedIn(source, p))
      .slice(0, 5),
  };
  return { questionnaire, about: about.length >= ABOUT_MIN_CHARS && quotedIn(source, about) ? about : null };
}

export function checkIcp(raw: unknown): ImportedIcp | null {
  const icp = parseIcpInput(obj(raw));
  if ("error" in icp || icp.who.length < MEMORY_MIN_CHARS) return null;
  return icp;
}

export interface ImportSource {
  /** Shown on the item, e.g. "LinkedIn profile" or "acme.com/about". */
  label: string;
  text: string;
}

const EXPERIENCE_KINDS: ImportedExperienceKind[] = ["CURRENT_WORK", "PAST_EXPERIENCE"];

/**
 * "I work as a Data Annotator at GenMorphics." A job title says nothing a post
 * could be written from, and the model mislabels when it was. The prompt
 * skips these; this catches the ones it lets through.
 */
const isBareRole = (content: string) => /^I (?:work|worked|serve|served|am|was) as (?:an? |the )?[^.,;]+ at [^.,;]+\.?$/i.test(content);

/**
 * Keeps an experience item only when its evidence is quoted from one source
 * and its content adds nothing that source does not say.
 */
export function checkExperience(raw: unknown, sources: ImportSource[], makeId: () => string): ImportedExperience[] {
  const out: ImportedExperience[] = [];
  const seen = new Set<string>();
  for (const item of list(raw)) {
    const r = obj(item);
    const kind = EXPERIENCE_KINDS.find((k) => k === r.kind);
    const content = text(r.content, EXPERIENCE_MAX_CHARS + 1);
    const evidence = text(r.evidence, 400);
    if (!kind || content.length < MEMORY_MIN_CHARS || content.length > EXPERIENCE_MAX_CHARS || isBareRole(content)) continue;
    const source = sources.find((s) => quotedIn(s.text, evidence));
    if (!source || unsupported(content, source.text).length) continue;
    // "We offer a demo" must not come back as "I engineered a demo", nor "a slow close" as "by day seven".
    if (overstatedVerbs(content, source.text).length || unsupportedSpelledFigures(content, source.text).length) continue;
    const key = matchKey(content);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: makeId(), kind, content, from: source.label });
    if (out.length === MAX_IMPORTED_EXPERIENCE) break;
  }
  return out;
}

export interface ProofPage {
  url: string;
  title: string;
  text: string;
}

// Not proof a post can cite: a security badge (judged on the claim, since a
// page may mention encryption beside a real fact), or a figure from a
// calculator or example (judged on both, since the quote is where it shows).
const SECURITY_BADGE = /\b(encrypt\w*|AES(-256)?|TLS|SOC ?2|GDPR|HIPAA|ISO ?27001|uptime|used to train)\b/i;
const MADE_UP_FIGURE = /\b(illustrative|example|estimated?|calculator|hypothetical)\b/i;
const COMMON_WORDS = new Set(["the", "and", "with", "for", "that", "this", "your", "our", "are", "from", "into", "has", "have", "its", "can", "you", "all"]);
// A third: a fair restatement adds linking words ("the setup takes"); a wrong one shares almost none.
const MIN_SHARED_WORDS = 1 / 3;

/** The claim's words, cut to their first five letters so "answers" meets "answer". */
const claimWords = (value: string) =>
  (value.toLowerCase().match(/\p{L}{3,}/gu) ?? []).filter((w) => !COMMON_WORDS.has(w)).map((w) => w.slice(0, 5));

/**
 * A claim restates its quote, so many of its words are the quote's. "AI
 * answers calls in under 1.8 seconds" shares none with "sub-1.8s voice
 * response": it says something the page does not.
 */
function restatesQuote(claim: string, quote: string): boolean {
  const words = claimWords(claim);
  if (!words.length) return false;
  const quoted = new Set(claimWords(quote));
  return words.filter((w) => quoted.has(w)).length / words.length >= MIN_SHARED_WORDS;
}

/**
 * Keeps a proof only when the page it names states it, word for word, the
 * claim adds no figure or name, and its words are the quote's.
 */
export function checkProofs(raw: unknown, pages: ProofPage[], makeId: () => string): ImportedProof[] {
  const out: ImportedProof[] = [];
  const seen = new Set<string>();
  for (const item of list(raw)) {
    const r = obj(item);
    const claim = text(r.claim, 300);
    const quote = text(r.quote, 500);
    if (claim.length < 10) continue;
    const page = pages.find((p) => p.url === text(r.source_url, 2000)) ?? pages.find((p) => quotedIn(p.text, quote));
    if (!page || !quotedIn(page.text, quote) || unsupported(claim, quote).length) continue;
    if (!restatesQuote(claim, quote) || SECURITY_BADGE.test(claim) || MADE_UP_FIGURE.test(`${claim} ${quote}`)) continue;
    const key = matchKey(claim);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: makeId(), claim, quote, source_url: page.url, source_title: page.title.slice(0, 160) });
    if (out.length === MAX_IMPORTED_PROOFS) break;
  }
  return out;
}

/** Lines worth showing in the "reading" feed: real sentences from the source, not navigation. */
export function glimpses(source: string, count: number): string[] {
  return unwrap(source)
    .split(/\n+|(?<=[.!?])\s+/)
    // A page title's separator ("— 24/7 AI receptionist") is not part of the sentence.
    .map((line) => line.replace(/\s+/g, " ").trim().replace(/^[^\p{L}\p{N}"“'‘(]+/u, ""))
    .filter((line) => line.length >= 30 && line.length <= 160 && line.split(" ").length >= 5 && !isLayout(line))
    .slice(0, count);
}

// Links and date ranges ("January 2022 - Present") are layout, not something the author said.
const isLayout = (line: string) => /https?:\/\/|www\.|linkedin\.com|@/i.test(line) || /\b(19|20)\d{2}\b.*(present|\b(19|20)\d{2}\b)/i.test(line);

/**
 * A PDF wraps a paragraph over several lines. Joins a long line that stops
 * mid-sentence to the next prose line, so a glimpse starts where its sentence
 * does. Headings, short lines like a location, and layout stay apart.
 */
function unwrap(source: string): string {
  const prose = (line: string) => !isLayout(line) && line.trim().length > 0;
  const lines = source.split("\n");
  let out = lines[0] ?? "";
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1].trim();
    const next = lines[i].trim();
    const wrapped = prev.length >= 40 && !/[.!?:]$/.test(prev) && prose(prev) && prose(next) && (next.length >= 25 || /[.!?]$/.test(next));
    out += (wrapped ? " " : "\n") + lines[i];
  }
  return out;
}
