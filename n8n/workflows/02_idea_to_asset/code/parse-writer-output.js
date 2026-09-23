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

// An empty draft must never reach the editor and the claims gate (a draft with
// no claims passes it). Fail the run instead.
if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  throw new Error('Writer returned no completion: ' + JSON.stringify(rawInput.error || rawInput).slice(0, 300));
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

let hookText = '';
let bodyText = '';
try {
  const parsed = parseModelJson(content);
  hookText = parsed.hook || '';
  bodyText = parsed.body_text || parsed.body_markdown || '';
} catch (err) {
  bodyText = content;
}

const idea = $('Select Target').first().json;
const strategy = $('Parse Strategy JSON').first().json.strategy || {};
const brandCtx = $('Assemble Brand Context').first().json;
const brandContext = brandCtx.brand_context || '';
const companyName = brandCtx.company_name || 'the brand';
// `Format Evidence Context` only runs on the Need Evidence? true branch. Any idea
// with evidence_required != 'Y' -- every manually injected idea, among others --
// skips it, and referencing a skipped node throws ExpressionError, killing the run
// AFTER both LLM calls have been paid for and leaving the idea stuck at PICKED.
// Build Writer Payload already guards this the same way; this node did not.
const evidenceBlock = ($('Need Evidence?').isExecuted && $('Format Evidence Context').isExecuted
  ? $('Format Evidence Context').first().json.evidence_block
  : null) || 'No external evidence supplied.';

// The editor prompt is rendered by the dashboard (src/lib/prompts/editor.ts).
return [{
  json: {
    idea: idea,
    strategy: strategy,
    evidence_block: evidenceBlock,
    prompt_inputs: {
      company_name: companyName,
      hook: hookText,
      body: bodyText,
      brand_context: brandContext,
      evidence_block: evidenceBlock,
      core_argument: strategy.core_argument || '',
      author_experience: ((brandCtx.author && brandCtx.author.memory) || []).map(m => m.text)
    }
  }
}];
