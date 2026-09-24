import { prisma } from "@/lib/prisma";
import { chatWithFallback } from "@/lib/ai/modelChain";
import { acceptRewrite, applyRewrites, bannedHits, bannedPhrases, offendingSentences } from "@/lib/drafts/banned";
import { renderScrub } from "@/lib/prompts/scrub";

export interface ScrubResult {
  /** The same keys as the input, with the accepted rewrites applied. */
  texts: Record<string, string>;
  rewritten: { from: string; to: string }[];
  /** Sentences left as they were, and why. */
  kept: { sentence: string; reason: string }[];
  /** Banned phrases still in any text after the repair (the gate blocks on these). */
  remaining: string[];
}

export async function tenantBannedPhrases(clientId: string): Promise<string[]> {
  const rows = await prisma.brandDirective.findMany({
    where: { clientId, category: "FORBIDDEN", isActive: true },
    select: { instruction: true },
  });
  return bannedPhrases(rows.map((r) => r.instruction ?? ""));
}

function parseRewrites(raw: string): Map<number, string> {
  const out = new Map<number, string>();
  try {
    const content = JSON.parse(raw)?.choices?.[0]?.message?.content ?? "";
    const json = JSON.parse(String(content).replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
    for (const r of Array.isArray(json?.rewrites) ? json.rewrites : []) {
      if (Number.isInteger(r?.id) && typeof r?.text === "string") out.set(r.id, r.text);
    }
  } catch {
    // An unreadable reply rewrites nothing; the gate still blocks.
  }
  return out;
}

/**
 * Rewrites the sentences that use a banned phrase, in every text of one draft
 * (body, hook, social variants). One model call, only when there is a hit.
 * Never throws for a model failure: the texts come back unchanged and
 * `remaining` says what is still there.
 */
export async function scrubBannedWords(
  clientId: string,
  texts: Record<string, string>,
  phrases?: string[]
): Promise<ScrubResult> {
  const banned = phrases ?? (await tenantBannedPhrases(clientId));
  const values = Object.values(texts);
  const offending = offendingSentences(values, banned);
  const result: ScrubResult = { texts: { ...texts }, rewritten: [], kept: [], remaining: [] };
  if (!offending.length) return result;

  const apiKey = process.env.DASHSCOPE_API_KEY;
  let replies = new Map<number, string>();
  if (apiKey) {
    try {
      const hitsBySentence = offending.map((s) => bannedHits(s, banned));
      const payload = renderScrub({ banned: Array.from(new Set(hitsBySentence.flat())), sentences: offending });
      const res = await chatWithFallback(payload as unknown as Record<string, unknown>, apiKey);
      if (res.status < 300) replies = parseRewrites(res.body);
      else console.warn(`[scrub] model answered ${res.status}: ${res.body.slice(0, 200)}`);
    } catch (e) {
      console.warn("[scrub] model call failed:", e);
    }
  }

  const accepted = new Map<string, string>();
  offending.forEach((sentence, i) => {
    const reply = replies.get(i + 1);
    const reason = reply === undefined ? "no rewrite came back" : acceptRewrite(sentence, reply, banned);
    if (reason || reply === undefined) result.kept.push({ sentence, reason: reason ?? "no rewrite came back" });
    else {
      accepted.set(sentence, reply.trim());
      result.rewritten.push({ from: sentence, to: reply.trim() });
    }
  });

  for (const [key, text] of Object.entries(texts)) result.texts[key] = applyRewrites(text, accepted);
  result.remaining = banned.filter((p) => Object.values(result.texts).some((t) => bannedHits(t, [p]).length));
  return result;
}
