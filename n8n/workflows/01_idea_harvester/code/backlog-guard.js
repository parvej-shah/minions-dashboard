const items = $input.all();
const rawRows = items.map(item => item.json).filter(r => r && r.idea_id);

// Only ideas the content plan can actually use count as backlog: refined,
// unclaimed, and passed by the idea gate. Ungated ideas from before the gate,
// and below-bar ones, never fill a slot ahead of time, so a pile of them must
// not stop the harvest a waiting slot asked for.
const usableBacklog = rawRows.filter(r => {
  const status = (r.status || '').trim().toUpperCase();
  const claimedAt = (r.claimed_at || '').trim();
  const verdict = (r.gate_verdict || '').trim().toUpperCase();
  return status === 'REFINED' && !claimedAt && verdict === 'PASS';
});

// Stop harvesting once 10 unused, gate-passed ideas are available.
const isFull = usableBacklog.length >= 10;

return [{
  json: {
    backlog_count: usableBacklog.length,
    skip_harvest: isFull,
    existing_rows: rawRows
  }
}];
