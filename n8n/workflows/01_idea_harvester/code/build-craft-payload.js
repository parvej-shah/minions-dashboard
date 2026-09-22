// Collect the fetched articles for the craft-notes call, which studies HOW
// each piece is built -- its opening move, evidence types, and closing --
// never its wording. The prompt is rendered by the dashboard
// (src/lib/prompts/craft.ts, instruction from src/lib/ai/craftExtract.ts).

const res = $('Fetch Source Articles').first()?.json || {};
const articles = Array.isArray(res.articles) ? res.articles : [];

if (articles.length === 0) {
  // Nothing fetchable -- pass through so the run continues without craft notes.
  return [{ json: { skip_craft: true } }];
}

return [{
  json: {
    skip_craft: false,
    article_urls: articles.map(a => a.url),
    article_texts: articles.map(a => a.text),
    prompt_inputs: {
      articles: articles.map(a => ({ title: a.title, url: a.url, text: a.text }))
    }
  }
}];
