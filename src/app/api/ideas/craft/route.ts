import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { fetchArticle, verbatimGuard, CRAFT_EXTRACT_INSTRUCTION } from "@/lib/ai/craftExtract";

const MAX_URLS = 6;

/**
 * Fetches source articles for the harvester and returns each one's readable
 * text plus the craft-extraction instruction.
 *
 * The harvester only ever saw an RSS headline and a 300-character snippet,
 * which is far too little to learn how a piece is built. n8n calls this with
 * the URLs behind the signals it chose, gets real article text back, and asks
 * the model for structural notes.
 *
 * This deliberately returns SOURCE TEXT plus an instruction rather than
 * finished notes: the LLM call lives in n8n alongside the rest of the
 * harvest prompt chain. `verbatimGuard` is exported for the return trip --
 * call POST with `notes` set to have lifted phrasing stripped before storage.
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  try {
    const body = await request.json();

    // Return trip: n8n sends back the notes its model produced, we enforce
    // the no-verbatim rule in code rather than trusting the prompt.
    if (typeof body.notes === "string" && typeof body.source_text === "string") {
      return NextResponse.json({
        success: true,
        craft_notes: verbatimGuard(body.notes, body.source_text),
      });
    }

    const urls: string[] = Array.isArray(body.urls) ? body.urls.slice(0, MAX_URLS) : [];
    if (urls.length === 0) {
      return apiFailure("urls array is required", 400);
    }

    const articles = await Promise.all(
      urls.map(async (url) => {
        const article = await fetchArticle(String(url));
        return article
          ? { url: article.url, title: article.title, text: article.text, ok: true }
          : { url: String(url), title: "", text: "", ok: false };
      })
    );

    return NextResponse.json({
      success: true,
      instruction: CRAFT_EXTRACT_INSTRUCTION,
      articles: articles.filter((a) => a.ok),
      failed: articles.filter((a) => !a.ok).map((a) => a.url),
    });
  } catch (error) {
    return apiError(error, "Failed to fetch source articles");
  }
}
