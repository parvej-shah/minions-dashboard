const input = $input.first().json || {};
const strategy = input.strategy || {};
const evidenceNeeds = Array.isArray(strategy.evidence_needs) ? strategy.evidence_needs : [];
const idea = input.idea || {};
const signals = Array.isArray(idea.signals) ? idea.signals : [];

const suppliedSources = signals
.filter(signal => signal && (signal.url || signal.snippet || signal.title))
.map((signal, index) => {
  const title = signal.title || 'Untitled source';
  const source = signal.source || 'Source';
  const url = signal.url || '';
  const snippet = signal.snippet || '';
  return `[SUPPLIED_SOURCE_${index + 1}] ${source}: ${title}\nURL: ${url}\nEXCERPT: ${snippet}`;
});

const unmetNeeds = evidenceNeeds.map((need, index) =>
  `[UNVERIFIED_NEED_${index + 1}] ${need}. This is a research requirement, not evidence. Do not state it as fact.`
);

const evidenceBlock = [
  ...suppliedSources,
  ...unmetNeeds,
  'Evidence policy: supplied excerpts are leads, not proof of claims beyond their exact wording. Never invent a statistic, customer story, result, quotation, source, or URL.'
].join('\n\n');

return [{
  json: {
    ...input,
    evidence_block: evidenceBlock || 'No external evidence supplied. Write only interpretation, opinion, or clearly labeled illustrative examples.'
  }
}];
