import { numbersIn } from "@/lib/harvest/text";

/**
 * A GENERALIZE memory item reaches the drafting prompts only as its lesson:
 * no names of people, companies or places, no figures, no links (D4, phase 4).
 * The model's rewrite (from the memory check) is used when code confirms it
 * dropped every specific; otherwise the item is redacted in code.
 */

/** Capitalised words not at the start of a sentence: names, places, brands. */
export function properNouns(s: string): string[] {
  const out = new Set<string>();
  for (const m of s.matchAll(/(?<![.!?:]\s|^)\b([A-Z][a-zA-Z0-9&'-]{2,})/g)) out.add(m[1]);
  // A run of capitalised words is a name even at the start of a sentence
  // ("Brightsmile Dental paid late").
  for (const m of s.matchAll(/\b[A-Z][a-zA-Z0-9&'-]{2,}(?:\s+[A-Z][a-zA-Z0-9&'-]{2,})+/g)) {
    for (const w of m[0].split(/\s+/)) out.add(w);
  }
  return [...out];
}

/** Specifics of the original that must not survive: names, figures (10 and up, money, %), links. */
function specificsOf(original: string): string[] {
  return [
    ...properNouns(original),
    ...numbersIn(original).filter((n) => Number(n) >= 10 || new RegExp(`${n.replace(".", "\\.")}\\s*%|[$€£৳]\\s?${n.replace(".", "\\.")}`).test(original)),
    ...(original.match(/https?:\/\/\S+/g) ?? []),
  ];
}

export function leakedSpecifics(original: string, rewritten: string): string[] {
  return specificsOf(original).filter((s) => (/^\d/.test(s) ? numbersIn(rewritten).includes(s) : new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(rewritten)));
}

/** Deterministic fallback: every specific replaced by a neutral word. */
export function redact(original: string): string {
  return original
    .replace(/https?:\/\/\S+/g, "a link")
    .replace(/[$€£৳]\s?\d[\d,.]*(?:\s?(?:k|m|bn|million|billion))?/gi, "a sum")
    .replace(/\b\d[\d,.]*\s?%/g, "a share")
    .replace(/\b\d{2,}[\d,.]*\b/g, "many")
    .replace(/(?<![.!?:]\s|^)\b[A-Z][a-zA-Z0-9&'-]{2,}(?:\s+[A-Z][a-zA-Z0-9&'-]{2,})*/g, "a client");
}

/** The text a draft may use for this item. */
export function generalizedText(original: string, modelRewrite: string | null | undefined): { text: string; by: "model" | "code" } {
  const rewrite = (modelRewrite ?? "").trim();
  if (rewrite && leakedSpecifics(original, rewrite).length === 0) return { text: rewrite, by: "model" };
  return { text: redact(original), by: "code" };
}
