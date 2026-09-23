const existingRows = $('Backlog Guard').first().json.existing_rows || [];
// /api/brand/context returns ONE object with the directives nested under
// `directives`. Filtering the raw input for a top-level `category` matched
// nothing, so every refine ran with an empty Brand context.
const brandCtx = $input.first()?.json || {};

const lanes = Array.isArray(brandCtx.content_lanes) ? brandCtx.content_lanes : [];

const newRows = existingRows.filter(r => (r.status || '').trim().toUpperCase() === 'NEW');

if (newRows.length === 0) {
  return [{
    json: {
      has_new: false,
      count: 0
    }
  }];
}

// The prompt is rendered by the dashboard (src/lib/prompts/refine.ts).
return [{
  json: {
    has_new: true,
    count: newRows.length,
    new_rows: newRows,
    // Parse Refine JSON maps the lane name the model picks back to its id.
    content_lanes: lanes,
    prompt_inputs: {
      directives: Array.isArray(brandCtx.directives) ? brandCtx.directives : [],
      new_rows: newRows,
      lanes: lanes.map(l => ({ name: l.name, brief: l.brief }))
    }
  }
}];
