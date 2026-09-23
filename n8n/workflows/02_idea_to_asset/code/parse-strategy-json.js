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

// Nothing downstream checks an ok flag: a failed strategy used to flow on and
// draft from nothing. Fail the run instead; the error workflow reports it.
if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  throw new Error('Strategist returned no completion: ' + JSON.stringify(rawInput.error || rawInput).slice(0, 300));
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

try {
  const strategy = parseModelJson(content);
  const idea = $('Select Target').first().json;
  const brandContext = $('Assemble Brand Context').first().json.brand_context;
  
  const needsEvidence = (idea.evidence_required === 'Y') || (Array.isArray(strategy.evidence_needs) && strategy.evidence_needs.length > 0);
  
  return [{
    json: {
      ok: true,
      strategy: strategy,
      idea: idea,
      brand_context: brandContext,
      evidence_required: needsEvidence ? 'Y' : 'N'
    }
  }];
} catch (err) {
  throw new Error('Strategy JSON parse error: ' + err.message + ' | ' + content.slice(0, 200));
}
