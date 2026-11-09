import {
  ICP_ITEM_MAX_CHARS,
  ICP_LIST_MAX,
  icpBuyer,
  MEMORY_DISCLOSURES,
  MEMORY_KINDS,
  MEMORY_MAX_CHARS,
  MEMORY_MIN_CHARS,
  type MemoryDisclosure,
  type MemoryKind,
} from "@/constants/contentLanes";
import type { IcpContext } from "@/services/authorContext";

/** Validation for the Brand page's ICP and memory writes. Returns an error message or the clean value. */

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = clean(item, ICP_ITEM_MAX_CHARS);
    if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  return out.slice(0, ICP_LIST_MAX);
}

export function parseIcpInput(body: unknown): IcpContext | { error: string } {
  if (!body || typeof body !== "object") return { error: "Expected a JSON object." };
  const b = body as Record<string, unknown>;
  return {
    who: clean(b.who, 600),
    role: clean(b.role, ICP_ITEM_MAX_CHARS),
    company_type: clean(b.company_type, ICP_ITEM_MAX_CHARS),
    pains: cleanList(b.pains),
    decisions: cleanList(b.decisions),
    questions: cleanList(b.questions),
    buying_triggers: cleanList(b.buying_triggers),
    vocabulary: cleanList(b.vocabulary),
    buyer: icpBuyer(b),
  };
}

export function parseMemoryContent(v: unknown): string | { error: string } {
  const content = typeof v === "string" ? v.trim() : "";
  if (content.length < MEMORY_MIN_CHARS) return { error: `Write at least ${MEMORY_MIN_CHARS} characters, so there is something specific to use.` };
  if (content.length > MEMORY_MAX_CHARS) return { error: `Keep it under ${MEMORY_MAX_CHARS} characters. Split a long story into two items.` };
  return content;
}

export function parseMemoryKind(v: unknown): MemoryKind | null {
  return (MEMORY_KINDS as readonly string[]).includes(String(v)) ? (v as MemoryKind) : null;
}

export function parseDisclosure(v: unknown, fallback: MemoryDisclosure = "PUBLIC"): MemoryDisclosure | null {
  if (v === undefined || v === null || v === "") return fallback;
  return (MEMORY_DISCLOSURES as readonly string[]).includes(String(v)) ? (v as MemoryDisclosure) : null;
}
