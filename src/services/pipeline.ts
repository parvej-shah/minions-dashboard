import { N8N_WEBHOOKS } from "@/constants/config";
import type { PipelineTriggerResult } from "@/types";

/**
 * Fires an n8n automation webhook and normalises the outcome.
 *
 * Every n8n call in the app goes through here, server-side. The endpoint URL is
 * deliberately not echoed back to the client: it is internal infrastructure.
 */
export async function triggerN8nWorkflow(
  webhook: keyof typeof N8N_WEBHOOKS,
  payload: Record<string, unknown>,
  messages: { failure: string; success: string }
): Promise<{ result: PipelineTriggerResult; status: number }> {
  const endpoint = N8N_WEBHOOKS[webhook];

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
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
