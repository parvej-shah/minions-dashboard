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

// At most 10 unused ideas wait at once: stop harvesting when the stock is
// full, and tell Assign Idea IDs how many new ideas still fit.
const IDEA_CAP = 10;
const isFull = unusedStock.length >= IDEA_CAP;

return [{
  json: {
    backlog_count: unusedStock.length,
    skip_harvest: isFull,
    room: Math.max(0, IDEA_CAP - unusedStock.length),
    existing_rows: rawRows
  }
}];
