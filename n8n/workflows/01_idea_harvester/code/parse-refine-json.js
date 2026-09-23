const rawInput = $input.all()[0]?.json || {};
const built = $('Build Refine Payload').first().json;
const newRows = built.new_rows || [];
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

  const clean = v => (typeof v === 'string' ? v : '').replace(/—/g, ', ').replace(/--/g, ', ');
  out.push({
    json: {
      idea_id: targetRow.idea_id,
      raw_idea: targetRow.raw_idea || '',
      // What the person wrote: the gate checks figures against it.
      note: [targetRow.raw_idea, targetRow.angle, targetRow.why].filter(Boolean).join(' '),
      angle: clean(ref.angle || targetRow.angle),
      // One ICP per tenant (PEER/BRIDGE were retired on 2026-09-23).
      audience: 'ICP',
      pillar: ref.pillar || targetRow.pillar || '',
      // The gate maps the lane name to the tenant's lane id.
      lane: ref.lane || '',
      batch_rank: ref.batch_rank || 1,
      evidence_required: ref.evidence_required || 'N',
      why: clean(ref.why),
      icp_problem: clean(ref.icp_problem),
      reader_context: clean(ref.reader_context),
      author_advantage: clean(ref.author_advantage),
      memory_refs: Array.isArray(ref.memory_refs) ? ref.memory_refs : [],
      evidence_quote: ref.evidence_quote || '',
      white_space: clean(ref.white_space),
      fresh_perspective: clean(ref.fresh_perspective),
      vision: ref.vision || null,
      profile_target: ref.profile_target || '',
      recommended_format: ref.recommended_format || '',
      status: 'REFINED'
    }
  });
}

return out;
