// Attach each idea's craft notes, enforcing the no-verbatim rule in code.
//
// A model told to describe structure will sometimes quote a whole sentence
// instead. Prompt instructions alone do not reliably stop that, and
// reproducing the source's actual sentences would be plagiarism no matter
// what the prompt says -- so any long literal run from the source is stripped
// here before the notes are ever stored. Mirrors verbatimGuard() in
// src/lib/ai/craftExtract.ts; keep the two in sync.

const MAX_VERBATIM_WORDS = 8;

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function verbatimGuard(notes, sourceText) {
  if (!notes || !sourceText) return notes;
  const haystack = normalize(sourceText);
  return notes
    .split(/(?<=[.!?])\s+/)
    .map(sentence => {
      const words = normalize(sentence).split(' ').filter(Boolean);
      if (words.length <= MAX_VERBATIM_WORDS) return sentence;
      for (let i = 0; i + MAX_VERBATIM_WORDS <= words.length; i++) {
        const run = words.slice(i, i + MAX_VERBATIM_WORDS + 1).join(' ');
        if (haystack.includes(run)) return '[…]';
      }
      return sentence;
    })
    .join(' ')
    .replace(/(\[…\]\s*)+/g, '[…] ')
    .trim();
}

const ideas = $('Dedupe Ideas').all().map(i => i.json);
const craftInput = $('Build Craft Payload').first()?.json || {};

// No fetchable sources this run -- pass the ideas through untouched.
if (craftInput.skip_craft) {
  return ideas.map(idea => ({ json: idea }));
}

let notesByUrl = {};
try {
  const raw = $('Qwen Craft Notes').first()?.json?.choices?.[0]?.message?.content || '';
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const urls = craftInput.article_urls || [];
  const texts = craftInput.article_texts || [];
  for (const entry of (parsed.notes || [])) {
    const i = Number(entry.index) - 1;
    if (i >= 0 && i < urls.length) {
      notesByUrl[urls[i]] = verbatimGuard(entry.craft_notes || '', texts[i] || '');
    }
  }
} catch (e) {
  // Craft notes are an enhancement, never a gate -- a bad parse must not
  // cost the run its ideas.
  notesByUrl = {};
}

return ideas.map(idea => ({
  json: {
    ...idea,
    craft_notes: notesByUrl[idea.source_url] || null,
    craft_source_url: notesByUrl[idea.source_url] ? idea.source_url : null
  }
}));
