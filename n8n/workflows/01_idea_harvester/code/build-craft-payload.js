// Turn the fetched articles into one LLM request that studies HOW each piece
// is built -- its opening move, evidence types, and closing -- never its
// wording. See src/lib/ai/craftExtract.ts for the full rationale; the API
// returns the instruction so both sides share one definition of what
// "learning from" a source is allowed to mean.

const res = $('Fetch Source Articles').first()?.json || {};
const articles = Array.isArray(res.articles) ? res.articles : [];
const instruction = res.instruction || '';

if (articles.length === 0 || !instruction) {
  // Nothing fetchable -- pass through so the run continues without craft notes.
  return [{ json: { skip_craft: true } }];
}

const userMessage = articles.map((a, i) =>
  `[${i + 1}] ${a.title}\nURL: ${a.url}\n---\n${a.text}`
).join('\n\n=====\n\n');

return [{
  json: {
    skip_craft: false,
    article_urls: articles.map(a => a.url),
    article_texts: articles.map(a => a.text),
    prompt_payload: {
      model: 'qwen3.7-max',
      enable_thinking: false,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: instruction + '\n\nYou will receive several numbered articles. Return {"notes":[{"index":1,"craft_notes":"..."}]} with one entry per article.' },
        { role: 'user', content: userMessage }
      ]
    }
  }
}];
