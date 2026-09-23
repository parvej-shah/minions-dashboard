const input = $input.first().json || {};
const body = input.body || input;
const clientId = (body.client_id || input.client_id || '').toString().trim();
// Never default to a tenant. A missing client_id used to fall back to tenant
// zero, which harvested ideas into getminions.ai's queue for whoever called.
if (!clientId) throw new Error('Harvest trigger has no client_id; refusing to guess a tenant.');
const callbackUrl = (body.callback_url || '').toString().trim();
// The Cockpit sends the webhook secret next to callback_url so the callback can
// authenticate against the run-status route. Without it that route answers 401
// and the run stays RUNNING, leaving the progress UI spinning indefinitely.
const callbackSecret = (body.callback_secret || '').toString().trim();
return [{ json: { ...input, client_id: clientId, callback_url: callbackUrl, callback_secret: callbackSecret } }];
