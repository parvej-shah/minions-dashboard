const data = $input.first().json;
const workflowName = data.workflow?.name || 'Unknown workflow';
const executionId = data.execution?.id || 'unknown';
const executionUrl = data.execution?.url || '';
const nodeName = data.execution?.lastNodeExecuted || data.trigger?.error?.node?.name || 'unknown node';
const errorMessage = data.execution?.error?.message || data.trigger?.error?.message || JSON.stringify(data).slice(0, 500);

const text = `⚠️ <b>Pipeline Failure</b>\n\n<b>Workflow:</b> ${workflowName}\n<b>Failed node:</b> ${nodeName}\n<b>Execution:</b> <code>${executionId}</code>\n<b>Error:</b> ${errorMessage}${executionUrl ? `\n\n<a href="${executionUrl}">Open execution</a>` : ''}`;

// The Cockpit creates a pipeline_runs row set to RUNNING and polls it. Alerting to
// Telegram alone left every failed run RUNNING forever, so the UI's progress HUD
// spun indefinitely and the page never refreshed -- indistinguishable from a slow
// run. Recover the callback_url the failing workflow was given and mark the run
// FAILED so the UI can say so.
const runData = data.execution?.data?.resultData?.runData || {};
// Only the validated run id is reused: Mark Run Failed posts to a fixed
// dashboard URL with the n8n credential, never to a URL from the trigger.
let callbackRunId = '';
for (const n of ['Generate run_id', 'Resolve Client ID']) {
  const out = runData[n]?.[0]?.data?.main?.[0]?.[0]?.json;
  const id = out && typeof out.callback_run_id === 'string' ? out.callback_run_id : '';
  if (/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    callbackRunId = id;
    break;
  }
}

return [{ json: { text, callback_run_id: callbackRunId, has_callback: !!callbackRunId, failed_node: nodeName, error_message: errorMessage } }];
