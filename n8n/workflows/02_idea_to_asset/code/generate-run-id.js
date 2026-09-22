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
const clientId = (triggerBody.client_id || '').toString().trim() || 'tenant-zero-getminions-ai';

const runId = triggerBody.run_id || generateUUID();
const callbackUrl = triggerBody.callback_url || null;
// The Cockpit sends the webhook secret alongside callback_url so the callback
// can authenticate. Without it the run-status route answers 401 and the run is
// stranded at RUNNING, which is what made the progress HUD spin forever.
const callbackSecret = triggerBody.callback_secret || '';
const nowIso = new Date().toISOString();
return [{
  json: {
    run_id: runId,
    timestamp: nowIso,
    requested_idea_id: requestedIdeaId,
    client_id: clientId,
    callback_url: callbackUrl,
    callback_secret: callbackSecret
  }
}];
