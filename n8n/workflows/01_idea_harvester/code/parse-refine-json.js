const rawInput = $input.all()[0]?.json || {};
const newRows = $('Build Refine Payload').first().json.new_rows || [];

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
      audience: ref.audience || targetRow.audience || 'ICP',
      pillar: ref.pillar || targetRow.pillar || 'Operational Focus',
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
