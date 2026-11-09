// The dashboard run this execution reports back to. Callbacks go to a FIXED
// dashboard URL with the n8n credential attached, so only the run id comes
// from the trigger, and only in a strict shape: a crafted "../" id must never
// steer the credential to another route.
function runIdFrom(url, explicit) {
  const fromUrl = (url.match(/\/api\/pipeline\/runs\/([^/?#]+)$/) || [])[1] || '';
  const id = (fromUrl || explicit || '').toString().trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(id) ? id : '';
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const trigger = $input.first().json || {};
const triggerBody = trigger.body || trigger;
// The Cockpit "Refine & Draft" button POSTs a specific idea_id. Carry it through so
// Select Target can honor it instead of silently drafting whatever it would auto-pick.
const requestedIdeaId = (triggerBody.idea_id || '').toString().trim() || null;
const clientId = (triggerBody.client_id || '').toString().trim();
// Never default to a tenant: a missing client_id used to draft into tenant zero.
if (!clientId) throw new Error('Draft trigger has no client_id; refusing to guess a tenant.');

const runId = triggerBody.run_id || generateUUID();
const callbackUrl = triggerBody.callback_url || null;
const callbackRunId = callbackUrl ? runIdFrom(callbackUrl, triggerBody.run_id) : '';
const nowIso = new Date().toISOString();
return [{
  json: {
    run_id: runId,
    timestamp: nowIso,
    requested_idea_id: requestedIdeaId,
    client_id: clientId,
    callback_url: callbackUrl,
    callback_run_id: callbackRunId
  }
}];
