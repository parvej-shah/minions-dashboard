// Resolve each idea's signal_index back to the actual article it came from,
// so the craft step has a URL to study and the idea carries attribution.
//
// The model returns signal_index (1-based) but never the URL itself; without
// this the source link was lost and every idea landed with source_url null.

const ideas = $input.all().map(i => i.json);
const signals = $('Build Harvest Payload').first()?.json?.market_signals || [];

return ideas.map(idea => {
  const idx = Number(idea.signal_index);
  const signal = Number.isInteger(idx) && idx >= 1 && idx <= signals.length
    ? signals[idx - 1]
    : null;

  return {
    json: {
      ...idea,
      source_url: signal?.url || null,
      source_title: signal?.title || null,
      source: signal?.source_name || idea.source || 'HARVESTER',
      signals: signal ? [{ title: signal.title, url: signal.url, source: signal.source_name }] : []
    }
  };
});
