import { fetchArticle, verbatimGuard, CRAFT_EXTRACT_INSTRUCTION } from "@/lib/ai/craftExtract";
import { badRequest } from "@/server/http/errors";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

const MAX_URLS = 6;

// Returns source text plus the extraction instruction; the LLM call itself lives in n8n.
// `notes` + `source_text` is the return trip, where verbatimGuard strips lifted phrasing.
export const POST = route({ auth: "webhook", failure: "Failed to fetch source articles" }, async ({ request }) => {
  const body = await readJson(request);

  if (typeof body.notes === "string" && typeof body.source_text === "string") {
    return { success: true, craft_notes: verbatimGuard(body.notes, body.source_text) };
  }

  const urls = Array.isArray(body.urls) ? body.urls.slice(0, MAX_URLS).map(String) : [];
  if (urls.length === 0) throw badRequest("urls array is required");

  const articles = await Promise.all(
    urls.map(async (url) => {
      const article = await fetchArticle(url);
      return article
        ? { url: article.url, title: article.title, text: article.text, ok: true }
        : { url, title: "", text: "", ok: false };
    })
  );

  return {
    success: true,
    instruction: CRAFT_EXTRACT_INSTRUCTION,
    articles: articles.filter((article) => article.ok),
    failed: articles.filter((article) => !article.ok).map((article) => article.url),
  };
});
