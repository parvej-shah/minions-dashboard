const rawInput = $input.all()[0]?.json || {};
const built = $('Build Refine Payload').first().json;
const newRows = built.new_rows || [];
const lanes = Array.isArray(built.content_lanes) ? built.content_lanes : [];
const laneIdFor = name => {
  const wanted = (name || '').toString().trim().toLowerCase();
  const lane = lanes.find(l => (l.name || '').toLowerCase() === wanted);
  return lane ? lane.id : null;
};

if (rawInput.error || !rawInput.choices || !rawInput.choices[0] || !rawInput.choices[0].message) {
  return [{
    json: {
      ok: false,
      error: rawInput.error || 'Refine call returned no message'
    }
  }];
}

let content = rawInput.choices[0].message.content || '';
content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

let refinedItems = [];
try {
  refinedItems = JSON.parse(content);
  if (!Array.isArray(refinedItems)) {
    refinedItems = [refinedItems];
  }
} catch (err) {
  return [{
    json: {
      ok: false,
      error: 'Parse error: ' + err.message,
      raw: content
    }
  }];
}

const out = [];
for (let i = 0; i < refinedItems.length; i++) {
  const ref = refinedItems[i];
  const targetRow = newRows[ref.row_index !== undefined ? ref.row_index : i] || newRows[i];
  if (!targetRow) continue;

  out.push({
    json: {
      idea_id: targetRow.idea_id,
      angle: (ref.angle || targetRow.angle || '').replace(/—/g, ', ').replace(/--/g, ', '),
      // One ICP per tenant (PEER/BRIDGE were retired on 2026-09-23).
      audience: 'ICP',
      pillar: ref.pillar || targetRow.pillar || '',
      // Unknown lane names become null rather than a guess.
      lane_id: laneIdFor(ref.lane),
      priority: ref.priority || 'HIGH',
      batch_rank: ref.batch_rank || 1,
      evidence_required: ref.evidence_required || 'N',
      why: (ref.why || '').replace(/—/g, ', ').replace(/--/g, ', '),
      icp_relevance: ref.icp_relevance || 4,
      status: 'REFINED'
    }
  });
}

return out;
