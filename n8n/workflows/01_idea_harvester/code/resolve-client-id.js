// The dashboard run this execution reports back to. Callbacks go to a FIXED
// dashboard URL with the n8n credential attached, so only the run id comes
// from the trigger, and only in a strict shape: a crafted "../" id must never
// steer the credential to another route.
function runIdFrom(url, explicit) {
  const fromUrl = (url.match(/\/api\/pipeline\/runs\/([^/?#]+)$/) || [])[1] || '';
  const id = (fromUrl || explicit || '').toString().trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(id) ? id : '';
}

// Headers carry the webhook secret; keep them out of every later node's data.
const { headers, ...input } = $input.first().json || {};
const body = input.body || input;
const clientId = (body.client_id || input.client_id || '').toString().trim();
// Never default to a tenant. A missing client_id used to fall back to tenant
// zero, which harvested ideas into getminions.ai's queue for whoever called.
if (!clientId) throw new Error('Harvest trigger has no client_id; refusing to guess a tenant.');
const callbackUrl = (body.callback_url || '').toString().trim();
const callbackRunId = callbackUrl ? runIdFrom(callbackUrl, body.run_id) : '';
return [{ json: { ...input, client_id: clientId, callback_url: callbackUrl, callback_run_id: callbackRunId } }];