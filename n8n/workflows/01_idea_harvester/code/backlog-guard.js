const items = $input.all();
const rawRows = items.map(item => item.json).filter(r => r && r.idea_id);

const unclaimedRefined = rawRows.filter(r => {
  const status = (r.status || '').trim().toUpperCase();
  const claimedAt = (r.claimed_at || '').trim();
  return status === 'REFINED' && !claimedAt;
});

// Spec §4: if count > 12 -> skip
const isFull = unclaimedRefined.length > 12;

return [{
  json: {
    backlog_count: unclaimedRefined.length,
    skip_harvest: isFull,
    existing_rows: rawRows
  }
}];
