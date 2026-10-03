import { N8N_WEBHOOKS } from "@/constants/config";
import { prisma } from "@/lib/prisma";
import { requireEnv, requireOneOfEnv } from "@/lib/env";
import type { PipelineTriggerResult } from "@/types";

// The n8n endpoint is internal infrastructure and is never echoed back to the client.
export async function triggerN8nWorkflow(
  webhook: keyof typeof N8N_WEBHOOKS,
  payload: Record<string, unknown>,
  messages: { failure: string; success: string }
): Promise<{ result: PipelineTriggerResult; status: number }> {
  const endpoint = N8N_WEBHOOKS[webhook];

  try {
    // The secret travels in a header: n8n stores request bodies in plain text in every execution log.
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": requireEnv("MINIONS_WEBHOOK_SECRET") },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[pipeline] ${webhook} returned HTTP ${res.status}: ${detail.slice(0, 500)}`);
      return {
        result: {
          success: false,
          n8n_connected: false,
          message: `${messages.failure} (HTTP ${res.status}).`,
        },
        status: 502,
      };
    }

    return {
      result: { success: true, n8n_connected: true, message: messages.success },
      status: 200,
    };
  } catch (error) {
    console.error(`[pipeline] Could not reach n8n for ${webhook}:`, error);
    return {
      result: {
        success: false,
        n8n_connected: false,
        message: "Could not reach the automation service. Check that n8n is running.",
      },
      status: 502,
    };
  }
}

const callbackUrl = (runId: string) => `${requireOneOfEnv("NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL")}/api/pipeline/runs/${runId}`;

export async function dispatchRun(
  webhook: keyof typeof N8N_WEBHOOKS,
  runId: string,
  payload: Record<string, unknown>,
  messages: { failure: string; success: string }
) {
  const outcome = await triggerN8nWorkflow(
    webhook,
    { ...payload, run_id: runId, callback_url: callbackUrl(runId) },
    messages
  );
  if (!outcome.result.success) await prisma.pipelineRun.update({ where: { id: runId }, data: { status: "FAILED" } });
  return outcome;
}

export function dispatchPublish(assetId: string, clientId: string) {
  return triggerN8nWorkflow(
    "publish",
    { asset_id: assetId, client_id: clientId, trigger_source: "MINIONS_COCKPIT_EDITORIAL" },
    {
      failure: "The publisher did not accept the request. Check that 03_review_publisher is active in n8n",
      success: "Publish run started. The post appears on the blog shortly.",
    }
  );
}
