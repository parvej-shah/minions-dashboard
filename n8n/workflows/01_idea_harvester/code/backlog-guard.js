const items = $input.all();
const rawRows = items.map(item => item.json).filter(r => r && r.idea_id);

// Every idea still waiting to be drafted counts as stock, whatever the gate
// said: the content plan drafts below-bar and never-gated ideas too when no
// passing one is ready (src/lib/plan/fill.ts). Rejected, drafted and claimed
// ideas are not stock.
const UNUSED_STATUSES = ['HARVESTED', 'REFINED', 'QUEUED'];
const unusedStock = rawRows.filter(r => {
  const status = (r.status || '').trim().toUpperCase();
  const claimedAt = (r.claimed_at || '').trim();
  const verdict = (r.gate_verdict || '').trim().toUpperCase();
  return UNUSED_STATUSES.includes(status) && !claimedAt && verdict !== 'REJECT';
});

// Stop harvesting once 15 unused ideas are in stock.
const isFull = unusedStock.length >= 15;

return [{
  json: {
    backlog_count: unusedStock.length,
    skip_harvest: isFull,
    existing_rows: rawRows
  }
}];
