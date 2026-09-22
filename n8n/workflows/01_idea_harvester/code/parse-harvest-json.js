const rawInput = $input.all()[0]?.json || {};
const marketSignals = $('Build Harvest Payload').first()?.json?.market_signals || [];

if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  return [{
    json: {
      ok: false,
      error: rawInput.error || 'Harvest call returned no message'
    }
  }];
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

let parsed = null;
try {
  parsed = JSON.parse(content);
} catch (err) {
  return [{
    json: {
      ok: false,
      error: 'Parse error: ' + err.message,
      raw: content
    }
  }];
}

let ideas = [];
if (Array.isArray(parsed)) {
  ideas = parsed;
} else if (parsed && Array.isArray(parsed.ideas)) {
  ideas = parsed.ideas;
} else if (parsed) {
  ideas = [parsed];
}

return ideas.map(idea => {
  let matchedSignal = null;
  const sigIdx = parseInt(idea.signal_index, 10);
  if (Number.isFinite(sigIdx) && sigIdx >= 1 && sigIdx <= marketSignals.length) {
    matchedSignal = marketSignals[sigIdx - 1];
  }

  const signalsList = matchedSignal ? [{
    title: matchedSignal.title || '',
    url: matchedSignal.url || '',
    source: matchedSignal.source_name || matchedSignal.source_key || 'Market Signal',
    snippet: matchedSignal.snippet || '',
    published_at: matchedSignal.published_at || ''
  }] : [];

  const sourceName = matchedSignal ? (matchedSignal.source_name || 'Signal Harvester') : 'Signal Harvester';
  const sourceUrl = matchedSignal ? (matchedSignal.url || null) : null;
  const sourceTitle = matchedSignal ? (matchedSignal.title || null) : null;

  const clIdea = {
    ...idea,
    audience: ['ICP', 'PEER', 'BRIDGE'].includes(idea.audience) ? idea.audience : 'ICP',
    raw_idea: (idea.raw_idea || '').replace(/—/g, ', ').replace(/--/g, ', '),
    angle: (idea.angle || '').replace(/—/g, ', ').replace(/--/g, ', '),
    why: (idea.why || '').replace(/—/g, ', ').replace(/--/g, ', '),
    source: sourceName,
    source_url: sourceUrl,
    source_title: sourceTitle,
    signals: signalsList
  };
  return { json: clIdea };
});
