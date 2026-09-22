const allRows = $input.all().map(item => item.json).filter(r => r && r.idea_id);
const runId = $('Generate run_id').first().json.run_id;

// Optional explicit idea target from webhook payload
let requestedIdeaId = null;
try {
  const webhookInput = $('Test Webhook Trigger')?.first()?.json?.body?.idea_id;
  if (webhookInput) requestedIdeaId = webhookInput;
} catch (e) {}

const STALE_CLAIM_MINUTES = 30;
const staleBefore = Date.now() - STALE_CLAIM_MINUTES * 60 * 1000;

const spokenFor = new Set();
for (const r of allRows) {
  const status = (r.status || '').trim().toUpperCase();
  if (['PICKED', 'REVIEW', 'PUBLISHED', 'DRAFTED'].includes(status)) {
    spokenFor.add(r.idea_id);
  }
}

// 1. If an explicit idea_id was requested by the human editor in Cockpit, grab it directly
if (requestedIdeaId) {
  const exactMatch = allRows.find(r => r.idea_id === requestedIdeaId);
  if (exactMatch) {
    // One idea -> one live asset. If a draft already exists for this idea, refuse to
    // draft again even if someone forced status back to QUEUED/HARVESTED from the
    // dashboard. The idea only becomes eligible again once its asset is deleted
    // (the asset DELETE endpoint clears draft_asset_id back to null).
    if (exactMatch.draft_asset_id) {
      return [{
        json: {
          found: false,
          run_id: runId,
          target: null,
          reason: 'ALREADY_DRAFTED',
          existing_asset_id: exactMatch.draft_asset_id
        }
      }];
    }
    const status = (exactMatch.status || '').trim().toUpperCase();
    const claimedAt = (exactMatch.claimed_at || '').trim();
    const isStale = status === 'PICKED' && claimedAt && new Date(claimedAt).getTime() < staleBefore;
    if (status === 'HARVESTED' || status === 'REFINED' || status === 'QUEUED' || isStale) {
      const nowIso = new Date().toISOString();
      return [{
        json: {
          found: true,
          run_id: runId,
          claimed_at: nowIso,
          orig_status: status,
          idea_id: exactMatch.idea_id,
          raw_idea: exactMatch.raw_idea,
          angle: exactMatch.angle,
          audience: exactMatch.audience,
          pillar: exactMatch.pillar,
          target_trade: exactMatch.target_trade || 'HVAC',
          geo_metro: exactMatch.geo_metro || '',
          priority: exactMatch.priority || 'HIGH',
          evidence_required: exactMatch.evidence_required || 'N',
          icp_relevance: exactMatch.icp_relevance,
          why: exactMatch.why,
          source: exactMatch.source || 'Signal Harvester',
          source_url: exactMatch.source_url || null,
          source_title: exactMatch.source_title || null,
          signals: exactMatch.signals || [],
          // The compare-and-set claim below has to match against whatever claimed_at
          // actually holds right now (often non-null: QUEUED and stale-PICKED rows were
          // claimed before), not assume it's null. Passing the real value through lets
          // Claim Idea Row build eq.<value> vs is.null correctly.
          orig_claimed_at: exactMatch.claimed_at || null,
          status: 'PICKED'
        }
      }];
    }
  }
}

// 2. Check for QUEUED ideas that are scheduled and due (scheduled_for <= now or null)
const nowMs = Date.now();
const queuedEligible = allRows.filter(r => {
  const status = (r.status || '').trim().toUpperCase();
  const claimedAt = (r.claimed_at || '').trim();
  if (r.draft_asset_id) return false;
  if (status !== 'PICKED' && spokenFor.has(r.idea_id)) return false;

  if (status === 'QUEUED' && !claimedAt) {
    if (!r.scheduled_for) return true; // immediate queue
    const schedMs = new Date(r.scheduled_for).getTime();
    return Number.isFinite(schedMs) && schedMs <= nowMs; // due
  }
  return false;
});

if (queuedEligible.length > 0) {
  // Sort queued by scheduled_for asc, queue_order asc, created_at asc
  queuedEligible.sort((a, b) => {
    const sA = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
    const sB = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
    if (sA !== sB) return sA - sB;
    const qA = a.queue_order || 999;
    const qB = b.queue_order || 999;
    if (qA !== qB) return qA - qB;
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
  });

  const target = queuedEligible[0];
  const nowIso = new Date().toISOString();
  return [{
    json: {
      found: true,
      run_id: runId,
      claimed_at: nowIso,
      orig_status: 'QUEUED',
      idea_id: target.idea_id,
      raw_idea: target.raw_idea,
      angle: target.angle,
      audience: target.audience,
      pillar: target.pillar,
      target_trade: target.target_trade || 'HVAC',
      geo_metro: target.geo_metro || '',
      priority: target.priority || 'HIGH',
      evidence_required: target.evidence_required || 'N',
      icp_relevance: target.icp_relevance,
      why: target.why,
      source: target.source || 'Signal Harvester',
      source_url: target.source_url || null,
      source_title: target.source_title || null,
      signals: target.signals || [],
      orig_claimed_at: target.claimed_at || null,
      status: 'PICKED'
    }
  }];
}

// 3. Fallback: Standard Harvested/Refined queue
const eligible = allRows.filter(r => {
  const status = (r.status || '').trim().toUpperCase();
  const claimedAt = (r.claimed_at || '').trim();

  if (r.draft_asset_id) return false;
  if (status !== 'PICKED' && spokenFor.has(r.idea_id)) return false;

  if ((status === 'REFINED' || status === 'HARVESTED') && !claimedAt) return true;

  if (status === 'PICKED' && claimedAt) {
    const claimedMs = new Date(claimedAt).getTime();
    return Number.isFinite(claimedMs) && claimedMs < staleBefore;
  }

  return false;
});

if (eligible.length === 0) {
  return [{
    json: {
      found: false,
      run_id: runId,
      target: null
    }
  }];
}

eligible.sort((a, b) => {
  const pA = (a.priority || '').trim().toUpperCase() === 'HIGH' ? 0 : 1;
  const pB = (b.priority || '').trim().toUpperCase() === 'HIGH' ? 0 : 1;
  if (pA !== pB) return pA - pB;

  const rankA = parseInt(a.batch_rank, 10) || 999;
  const rankB = parseInt(b.batch_rank, 10) || 999;
  if (rankA !== rankB) return rankA - rankB;

  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
});

const target = eligible[0];
const nowIso = new Date().toISOString();

return [{
  json: {
    found: true,
    run_id: runId,
    claimed_at: nowIso,
    orig_status: (target.status || '').trim().toUpperCase(),
    idea_id: target.idea_id,
    raw_idea: target.raw_idea,
    angle: target.angle,
    audience: target.audience,
    pillar: target.pillar,
    target_trade: target.target_trade || 'HVAC',
    geo_metro: target.geo_metro || '',
    priority: target.priority || 'HIGH',
    evidence_required: target.evidence_required || 'N',
    icp_relevance: target.icp_relevance,
    why: target.why,
    source: target.source || 'Signal Harvester',
    source_url: target.source_url || null,
    source_title: target.source_title || null,
    signals: target.signals || [],
    orig_claimed_at: target.claimed_at || null,
    status: 'PICKED'
  }
}];
