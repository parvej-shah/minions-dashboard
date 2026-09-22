const rows = $input.all().map(i => i.json);
const ids = rows.map(r => r.id).filter(Boolean);
const text = `🧹 <b>Stale claim sweeper</b>\n\nUnstuck ${ids.length} idea(s) that were stuck at PICKED for 30+ minutes (likely a crashed draft run):\n${ids.map(id => `• <code>${id}</code>`).join('\n')}`;
return [{ json: { text } }];
