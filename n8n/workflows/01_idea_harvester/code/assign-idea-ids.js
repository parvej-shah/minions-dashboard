// Reads the craft-merged output, not Dedupe Ideas directly -- craft_notes
// and craft_source_url are attached downstream of dedupe.
const ideas = $('Merge Craft Into Ideas').all().map(i => i.json);

const globalMaxRow = $('Read Global Max Idea ID').first().json || {};
let maxNum = 0;
const globalMatch = (globalMaxRow.id || '').match(/^IDEA-(\d+)$/);
if (globalMatch) {
  maxNum = parseInt(globalMatch[1], 10);
}

const nowIso = new Date().toISOString();

const rowsToAppend = ideas.map((idea, idx) => {
  const nextNum = maxNum + idx + 1;
  const ideaId = `IDEA-${String(nextNum).padStart(4, '0')}`;
  return {
    idea_id: ideaId,
    created_at: nowIso,
    source: idea.source || 'Signal Harvester',
    source_url: idea.source_url || null,
    source_title: idea.source_title || null,
    signals: idea.signals || [],
    raw_idea: idea.raw_idea || '',
    angle: idea.angle || '',
    audience: idea.audience || 'ICP',
    pillar: idea.pillar || 'Operational Focus',
    priority: idea.priority || 'HIGH',
    batch_rank: idea.batch_rank || (idx + 1),
    evidence_required: idea.evidence_required || 'N',
    target_trade: idea.target_trade || 'UNSPECIFIED',
    geo_metro: idea.geo_metro || '',
    status: 'REFINED',
    claimed_at: '',
    run_id: '',
    asset_id: '',
    why: idea.why || '',
    icp_relevance: idea.icp_relevance || 4,
    // Fingerprint of this idea's claim, computed in Dedupe Ideas. Storing it
    // lets the NEXT run recognize a reworded restatement without recomputing
    // keys for the whole backlog.
    thesis_key: idea.thesis_key || null,
    // "Steal like an artist": the structural lesson drawn from the source
    // article, never its wording. Attribution travels with craft_source_url.
    craft_notes: idea.craft_notes || null,
    craft_source_url: idea.craft_source_url || null
  };
});

return rowsToAppend.map(r => ({ json: r }));
