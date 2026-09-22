// This node is the whole reason the async split is safe to ship. If the attach
// call fails, the asset stays PENDING forever and the editorial UI shows a
// cover that never arrives, with nothing anywhere saying why. Throw so the run
// is recorded as an error and 00c_pipeline_error_alert reports it.
const res = $input.first().json || {};
const code = res.statusCode;

if (typeof code === 'number' && (code < 200 || code >= 300)) {
  const body = res.body || {};
  const detail = body.error || body.message || JSON.stringify(body).slice(0, 300);
  throw new Error(`Hero attach rejected (HTTP ${code}): ${detail}`);
}

return $input.all();
