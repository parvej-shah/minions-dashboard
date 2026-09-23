// Models regularly put raw line breaks inside JSON strings, which JSON.parse
// rejects. Mirrors parseModelJson in src/lib/modelJson.ts; keep in sync.
function parseModelJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    let out = '';
    let inString = false;
    let escaped = false;
    for (const ch of cleaned) {
      if (!inString) {
        if (ch === '"') inString = true;
        out += ch;
      } else if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === '\\') {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === '\n') out += '\\n';
      else if (ch === '\t') out += '\\t';
      else if (ch !== '\r') out += ch;
    }
    return JSON.parse(out);
  }
}

const rawInput = $input.all()[0]?.json || {};

// A failed edit used to reach the claims gate as an EMPTY body with no claims,
// which passes it: an empty draft saved as claims-OK. Fail the run instead.
if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  throw new Error('Editor returned no completion: ' + JSON.stringify(rawInput.error || rawInput).slice(0, 300));
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

try {
  const parsed = parseModelJson(content);
  if (!String(parsed.body || '').trim()) throw new Error('Editor returned an empty body.');
  const idea = $('Select Target').first().json;
  const strategy = $('Parse Strategy JSON').first().json.strategy || {};
  
  return [{
    json: {
      ok: true,
      idea: idea,
      strategy: strategy,
      hook: parsed.hook || strategy.hook || '',
      edited_body: parsed.body || '',
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      forbidden_hits: Array.isArray(parsed.forbidden_hits) ? parsed.forbidden_hits : []
    }
  }];
} catch (err) {
  throw new Error('Editor JSON parse error: ' + err.message + ' | ' + content.slice(0, 200));
}
