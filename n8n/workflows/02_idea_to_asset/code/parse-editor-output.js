const rawInput = $input.all()[0]?.json || {};

if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  return [{
    json: {
      ok: false,
      error: rawInput.error || 'Editor failed to return completion'
    }
  }];
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

try {
  const parsed = JSON.parse(content);
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
  return [{
    json: {
      ok: false,
      error: 'Editor JSON parse error: ' + err.message,
      raw_content: content
    }
  }];
}
