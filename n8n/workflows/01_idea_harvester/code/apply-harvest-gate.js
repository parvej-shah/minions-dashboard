// Splits the gate's reply back into one item per idea.
//
// The gate (POST /api/internal/harvest/gate, src/lib/harvest/gate.ts) decides
// each idea's verdict in code: PASS, BELOW_BAR or REJECT. Rejected ideas are
// still stored, archived with their reasons, so the Ideas page can show why
// they were dropped. It also replaced Dedupe Ideas: restating a recent idea
// is one of its reject reasons.

const res = $input.first()?.json || {};
if (!Array.isArray(res.ideas)) {
  throw new Error('The idea gate returned no ideas: ' + JSON.stringify(res).slice(0, 300));
}
if (res.ideas.length === 0) {
  throw new Error('The harvest produced no ideas to gate.');
}

return res.ideas.map(idea => {
  const rejected = idea.gate_verdict === 'REJECT';
  return {
    json: {
      ...idea,
      status: rejected ? 'REJECTED' : 'REFINED',
      rejection_reason: rejected ? (idea.gate_reasons || []).join(' ') : null
    }
  };
});
