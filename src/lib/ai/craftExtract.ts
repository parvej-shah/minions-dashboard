/**
 * "Steal like an artist" — learning craft from a source article without
 * copying it.
 *
 * The harvester previously showed the model only a headline and a 300-char
 * RSS snippet, which is not enough to learn anything about how a good piece
 * is built. This fetches the actual article and reduces it to a STRUCTURAL
 * lesson: how it opens, what kind of evidence it leans on, how it sequences
 * the argument, how it closes.
 *
 * The distinction that keeps this legitimate (and the one Kleon's book is
 * actually making) is transformation, not reproduction:
 *
 *   - We extract the SHAPE of the argument, never its sentences.
 *   - The output is deliberately capped and abstracted so it cannot serve as
 *     a reservoir of the original's phrasing.
 *   - `verbatimGuard` strips any long literal run that survives, so a lazy
 *     model can't smuggle the source's wording through as a "note".
 *   - The source URL travels with the notes for attribution, and downstream
 *     prompts forbid reusing the original's phrasing.
 *
 * Reproducing the source's actual sentences would be plagiarism regardless of
 * what the prompt says, so the guard is enforced in code rather than trusted
 * to the model.
 */
import { assertSafeFetchTarget } from "@/lib/ssrf-guard";

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 800_000;
const MAX_REDIRECTS = 2;
/** Enough body text for structure to be visible, far short of a usable copy. */
const MAX_ARTICLE_CHARS = 6000;
/** Longest literal run from the source allowed to survive into craft notes. */
const MAX_VERBATIM_WORDS = 8;

export interface ArticleContent {
  url: string;
  title: string;
  text: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches one article's readable text. Best-effort: returns null on any
 * failure so a dead link never fails a harvest run.
 */
export async function fetchArticle(rawUrl: string): Promise<ArticleContent | null> {
  let current = rawUrl.trim();
  if (!current) return null;
  if (!/^https?:\/\//i.test(current)) current = `https://${current}`;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = await assertSafeFetchTarget(current);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(current, {
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MinionsHarvestBot/1.0)" },
        });

        if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
          current = new URL(res.headers.get("location")!, parsed).toString();
          continue;
        }
        if (!res.ok) return null;
        if (!(res.headers.get("content-type") || "").includes("text/html")) return null;

        const reader = res.body?.getReader();
        if (!reader) return null;
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (received < MAX_BYTES) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
          }
        }
        reader.cancel().catch(() => {});
        const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");

        const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
        const article = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i)?.[1];
        const body = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)?.[1];
        const text = stripHtml(article || body || html).slice(0, MAX_ARTICLE_CHARS);

        if (text.length < 400) return null; // too thin to learn structure from
        return { url: current, title, text };
      } finally {
        clearTimeout(timeout);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Removes any run of more than MAX_VERBATIM_WORDS consecutive words that
 * appears literally in the source. This is the enforcement behind "steal like
 * an artist, don't copy" -- a model told to describe structure will sometimes
 * quote a whole sentence instead, and a prompt alone will not reliably stop
 * it. Anything caught is replaced with an ellipsis rather than silently
 * dropped, so a reviewer can see that something was cut.
 */
export function verbatimGuard(notes: string, sourceText: string): string {
  if (!notes || !sourceText) return notes;

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const haystack = normalize(sourceText);

  return notes
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      const words = normalize(sentence).split(" ").filter(Boolean);
      if (words.length <= MAX_VERBATIM_WORDS) return sentence;
      for (let i = 0; i + MAX_VERBATIM_WORDS <= words.length; i++) {
        const run = words.slice(i, i + MAX_VERBATIM_WORDS + 1).join(" ");
        if (haystack.includes(run)) return "[…]";
      }
      return sentence;
    })
    .join(" ")
    .replace(/(\[…\]\s*)+/g, "[…] ")
    .trim();
}

/**
 * The instruction given to the model when turning an article into craft
 * notes. Exported so the n8n harvester and any local caller share one
 * definition of what "learning from" a source is allowed to mean.
 */
export const CRAFT_EXTRACT_INSTRUCTION = `You are studying how a piece of writing is BUILT, the way a musician studies a song's arrangement rather than its lyrics.

Describe ONLY the structure and technique:
- How it opens, and what makes that opening earn attention.
- The order it develops the argument in.
- What kinds of evidence it uses (data, anecdote, analogy, authority, counterexample).
- How it handles the reader's likely objection.
- How it closes.

HARD RULES:
1. Never reproduce a sentence, phrase, or distinctive wording from the source. Describe the move, not the words.
2. Never restate the source's actual claims as if they were ours. We are learning its shape, not borrowing its conclusions.
3. Never invent detail that is not present in the source.
4. Write at most 120 words, as terse technique notes.

Return ONLY JSON: {"craft_notes": "..."}`;
