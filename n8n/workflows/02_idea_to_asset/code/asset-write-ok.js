// `Sync Asset to DB` runs with neverError + continueRegularOutput, so a PostgREST
// rejection returns a 4xx BODY on the success branch and the workflow sails on to
// report COMPLETED. That hid `PGRST204: Could not find the 'hero_attempts' column`
// for a full day: the idea was marked REVIEW with a draft_asset_id pointing at an
// asset row that was never written, so the draft looked lost in the UI.
//
// Throw on a non-2xx so the run is recorded as failed and the error workflow can
// mark the pipeline_run FAILED, instead of claiming success with no asset.
const res = $input.first().json || {};
const code = res.statusCode;

if (typeof code === 'number' && (code < 200 || code >= 300)) {
  const body = res.body || {};
  const detail = body.message || body.hint || JSON.stringify(body).slice(0, 300);
  throw new Error(`Asset write rejected (HTTP ${code}): ${detail}`);
}

return $input.all();
