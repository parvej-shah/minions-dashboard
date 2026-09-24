import {
  MEMORY_DISCLOSURES,
  MEMORY_KINDS,
  MEMORY_MAX_CHARS,
  MEMORY_MIN_CHARS,
  type MemoryDisclosure,
  type MemoryKind,
} from "@/constants/contentLanes";

/**
 * Checks the items a model proposes from a weekly answer (phase 6). The model
 * only proposes; code decides what the author is shown. An item that adds a
 * figure, a name or a link the answer does not contain is dropped, so a
 * memory can never say more than the author did.
 */

export const MAX_PULSE_ITEMS = 3;
export const PULSE_ANSWER_MIN_CHARS = MEMORY_MIN_CHARS;
export const PULSE_ANSWER_MAX_CHARS = 3000;

export interface PulseFollowups {
  problem?: string;
  who?: string;
  /** "YES" | "NO" | "" -- can the specifics be named publicly. */
  named?: string;
  evidence?: string;
}

export interface PulseCandidate {
  kind: MemoryKind;
  content: string;
  disclosure: MemoryDisclosure;
}

export interface ExtractResult {
  candidates: PulseCandidate[];
  /** Why proposed items were dropped, for the log and the eval. */
  dropped: { content: string; reason: string }[];
  /** True when no model item survived and the answer itself is offered. */
  fallback: boolean;
}

const words = (s: string) => new Set(s.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'.-]*/gu)?.map((w) => w.replace(/[.'-]+$/, "")) ?? []);

/** What an item says that its source does not: figures, links, and capitalised names. */
export function unsupported(item: string, source: string): string[] {
  const src = source.toLowerCase();
  const srcWords = words(source);
  const out: string[] = [];
  for (const n of item.match(/\d+(?:[.,]\d+)*/g) ?? []) if (!src.includes(n)) out.push(n);
  for (const l of item.match(/https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []) if (!src.includes(l.toLowerCase())) out.push(l);
  // A capitalised word that does not start a sentence is a name, product or
  // place; it must appear in the source.
  for (const m of item.matchAll(/(?<![.!?:]\s|^|["“(]\s?)\b\p{Lu}[\p{L}\p{N}'-]+/gu)) {
    if (/^I['’]/.test(m[0])) continue; // I'm, I've, I'd
    const w = m[0].toLowerCase().replace(/'s$/, "");
    if (!srcWords.has(w) && !src.includes(w)) out.push(m[0]);
  }
  return Array.from(new Set(out));
}

export function sourceText(answer: string, f: PulseFollowups): string {
  return [answer, f.problem, f.who, f.evidence].filter(Boolean).join("\n");
}

function disclosureFrom(f: PulseFollowups, suggested: unknown): MemoryDisclosure {
  if (f.named === "YES") return "PUBLIC";
  if (f.named === "NO") return "GENERALIZE";
  return (MEMORY_DISCLOSURES as readonly string[]).includes(String(suggested)) ? (suggested as MemoryDisclosure) : "PUBLIC";
}

/**
 * Reads the model's JSON reply (the message content), tolerating code fences.
 * Null means no usable reply (the call failed or the JSON is broken); an empty
 * list means the model found nothing specific worth saving.
 */
export function parseItems(content: string | null): unknown[] | null {
  if (!content) return null;
  try {
    const json = JSON.parse(content.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
    return Array.isArray(json?.items) ? json.items : null;
  } catch {
    return null;
  }
}

export function checkCandidates(raw: unknown[] | null, answer: string, followups: PulseFollowups): ExtractResult {
  // The model read the answer and found nothing specific: say so, rather than
  // saving the vague answer as a memory.
  if (raw && raw.length === 0) return { candidates: [], dropped: [], fallback: false };
  const source = sourceText(answer, followups);
  const candidates: PulseCandidate[] = [];
  const dropped: ExtractResult["dropped"] = [];
  const seen = new Set<string>();

  for (const r of raw ?? []) {
    const item = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const content = typeof item.content === "string" ? item.content.trim() : "";
    const kind = (MEMORY_KINDS as readonly string[]).includes(String(item.kind)) ? (item.kind as MemoryKind) : null;
    if (!content || !kind) {
      dropped.push({ content, reason: "no content or an unknown kind" });
      continue;
    }
    if (content.length < MEMORY_MIN_CHARS || content.length > MEMORY_MAX_CHARS) {
      dropped.push({ content, reason: "too short or too long" });
      continue;
    }
    const extra = unsupported(content, source);
    if (extra.length) {
      dropped.push({ content, reason: `adds what the answer does not say: ${extra.join(", ")}` });
      continue;
    }
    const key = content.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ kind, content, disclosure: disclosureFrom(followups, item.disclosure) });
    if (candidates.length === MAX_PULSE_ITEMS) break;
  }

  if (candidates.length) return { candidates, dropped, fallback: false };
  // Nothing usable came back: offer the answer itself, for the author to edit.
  const own = answer.trim().slice(0, MEMORY_MAX_CHARS);
  return {
    candidates: own.length >= MEMORY_MIN_CHARS ? [{ kind: "CURRENT_WORK", content: own, disclosure: disclosureFrom(followups, "PUBLIC") }] : [],
    dropped,
    fallback: true,
  };
}
