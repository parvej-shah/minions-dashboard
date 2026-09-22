function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const clientId = $json.client_id;
const runId = generateUUID();
const callbackUrl = `https://minions.getminions.ai/api/pipeline/runs/${runId}`;
return [{ json: { client_id: clientId, run_id: runId, callback_url: callbackUrl } }];
