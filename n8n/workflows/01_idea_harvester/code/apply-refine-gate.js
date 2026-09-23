// Splits the gate's reply back into one item per refined idea. A person's own
// note is never rejected (src/lib/harvest/gate.ts), only labelled BELOW_BAR
// when it names no ICP problem or rests on nothing the author has lived.

const res = $input.first()?.json || {};
if (!Array.isArray(res.ideas)) {
  throw new Error('The idea gate returned no ideas: ' + JSON.stringify(res).slice(0, 300));
}

return res.ideas.map(idea => ({ json: idea }));
