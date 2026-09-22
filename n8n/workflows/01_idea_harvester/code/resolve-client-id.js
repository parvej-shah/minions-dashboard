const input = $input.first().json || {};
const body = input.body || input;
const clientId = (body.client_id || input.client_id || '').toString().trim() || 'tenant-zero-getminions-ai';
const callbackUrl = (body.callback_url || '').toString().trim();
// The Cockpit sends the webhook secret next to callback_url so the callback can
// authenticate against the run-status route. Without it that route answers 401
// and the run stays RUNNING, leaving the progress UI spinning indefinitely.
const callbackSecret = (body.callback_secret || '').toString().trim();
return [{ json: { ...input, client_id: clientId, callback_url: callbackUrl, callback_secret: callbackSecret } }];
