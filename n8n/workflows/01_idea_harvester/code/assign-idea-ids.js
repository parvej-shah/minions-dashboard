// Reads the craft-merged output, not Dedupe Ideas directly -- craft_notes
// and craft_source_url are attached downstream of dedupe.
const merged = $('Merge Craft Into Ideas').all().map(i => i.json);

// Only as many kept ideas as the backlog has room for (Backlog Guard caps the
// unused stock at 10); rejected ideas are stored as archive and never count.
const room = Number($('Backlog Guard').first().json.room ?? Infinity);
let kept = 0;
const ideas = merged.filter(idea => {
  if ((idea.gate_verdict || '').toUpperCase() === 'REJECT') return true;
  kept += 1;
  return kept <= room;
});

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
    pillar: idea.pillar || '',
    // Set by the gate from the idea's score, not by the model.
    priority: idea.priority || 'LOW',
    batch_rank: idea.batch_rank || (idx + 1),
    // Harvested ideas always go through 02's evidence step (the model used
    // to answer "Y" for every one; the field is no longer asked of it).
    evidence_required: 'Y',
    target_trade: idea.target_trade || '',
    geo_metro: idea.geo_metro || '',
    // REJECTED for ideas the gate dropped (archived, with their reasons).
    status: idea.status || 'REFINED',
    rejection_reason: idea.rejection_reason || null,
    claimed_at: '',
    run_id: '',
    asset_id: '',
    why: idea.why || '',
    icp_relevance: Number.isFinite(idea.icp_relevance) ? idea.icp_relevance : 50,
    // Fingerprint of this idea's claim, computed by the gate. Storing it
    // lets the NEXT run recognize a reworded restatement without recomputing
    // keys for the whole backlog.
    thesis_key: idea.thesis_key || null,
    // The authority flywheel fields, all set or checked by the gate.
    source_type: idea.source_type || null,
    lane_id: idea.lane_id || null,
    profile_target: idea.profile_target || null,
    recommended_format: idea.recommended_format || null,
    memory_ids: idea.memory_ids || [],
    trust_basis: idea.trust_basis || [],
    icp_problem: idea.icp_problem || null,
    reader_context: idea.reader_context || null,
    author_advantage: idea.author_advantage || null,
    white_space: idea.white_space || null,
    fresh_perspective: idea.fresh_perspective || null,
    vision: idea.vision || null,
    gate_verdict: idea.gate_verdict || null,
    gate_reasons: idea.gate_reasons || [],
    score_breakdown: idea.score_breakdown || null,
    // "Steal like an artist": the structural lesson drawn from the source
    // article, never its wording. Attribution travels with craft_source_url.
    craft_notes: idea.craft_notes || null,
    craft_source_url: idea.craft_source_url || null
  };
});

return rowsToAppend.map(r => ({ json: r }));
