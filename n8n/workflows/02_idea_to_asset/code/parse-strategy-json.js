const rawInput = $input.all()[0]?.json || {};

if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  return [{
    json: {
      ok: false,
      error: rawInput.error || 'Strategist failed to return completion'
    }
  }];
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

try {
  const strategy = JSON.parse(content);
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
  return [{
    json: {
      ok: false,
      error: 'Strategy JSON parse error: ' + err.message,
      raw_content: content
    }
  }];
}
