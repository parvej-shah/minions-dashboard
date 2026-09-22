const rawInput = $input.all()[0]?.json || {};

if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  return [{
    json: {
      ok: false,
      error: rawInput.error || 'Writer failed to return completion'
    }
  }];
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

let hookText = '';
let bodyText = '';
try {
  const parsed = JSON.parse(content);
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
    prompt_inputs: {
      company_name: companyName,
      hook: hookText,
      body: bodyText,
      brand_context: brandContext,
      evidence_block: evidenceBlock
    }
  }
}];
