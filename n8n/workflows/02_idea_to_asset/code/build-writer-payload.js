const input = $input.all()[0]?.json || {};
const strategy = input.strategy || $('Parse Strategy JSON').first().json.strategy || {};
const evidenceBlock = input.evidence_block || 'None';
const brandContext = input.brand_context || $('Assemble Brand Context').first().json.brand_context;
const idea = input.idea || $('Select Target').first().json;
const brandCtx = $('Assemble Brand Context').first().json;

// The writer prompt is rendered by the dashboard (src/lib/prompts/writer.ts).
return [{
  json: {
    idea: idea,
    strategy: strategy,
    prompt_inputs: {
      company_name: brandCtx.company_name || 'the brand',
      strategy: strategy,
      evidence_block: evidenceBlock,
      brand_context: brandContext,
      tone_examples: Array.isArray(brandCtx.tone_examples) ? brandCtx.tone_examples : [],
      tone_questionnaire: brandCtx.tone_questionnaire || null
    }
  }
}];
