/**
 * Model fallback for every pipeline model call.
 *
 * The primary models run on QwenCloud free-tier quota with "free quota only"
 * on, so once a model's quota is used up DashScope refuses the call. Instead
 * of failing the run, the call moves down the model's chain: other models
 * that still have free quota first, and the model the stage used before the
 * switch as the last resort.
 *
 * Only an unavailable model moves the call on (quota used up, model not
 * offered, rate-limited). Any other error -- a bad request, a timeout, a 5xx --
 * is returned as it is, so n8n's own retry and error handling see it.
 *
 * n8n reaches this through POST /api/internal/llm/chat/completions.
 */

import { DASHSCOPE_CHAT_URL } from "@/constants/dashscope";
import { callCostUsd, recordCost } from "@/lib/ai/cost";

/**
 * Models the account can reach (probed 2026-10-21). qwen3-max, deepseek-v3.2
 * and deepseek-v4-flash no longer exist on it, and glm-5.2's free quota is
 * used up, so none of them is tried any more. deepseek-v4-pro-0813 is the
 * same model under a dated name with its own free quota (to 2026-11-13).
 */
const DEEPSEEK = ["deepseek-v4-pro", "deepseek-v4-pro-0813"];
const LARGE = [...DEEPSEEK, "glm-5.1"];

/**
 * Primary model -> what to try after it, in order. A model not listed here
 * has no fallback. Keep every model a prompt in src/lib/prompts names listed
 * (a test checks that).
 */
export const MODEL_FALLBACKS: Record<string, string[]> = {
  // The large stages (strategist, writer, rewrite, harvest, pulse, craft, carousel, follow-up, cover line).
  // Writer comparison 2026-10-12 (same 6 strategies, Jev 0-4 "reads as one person"): deepseek-v4-pro 2.36,
  // glm-5.2 2.30, glm-5.1 2.19, qwen3.7-max 2.13, qwen3.6-plus 1.71, qwen3.7-plus 1.45; all returned valid JSON.
  // glm-5.1 wins on what is left: close to the top, the tightest drafts (301 words vs 391-456) and the fastest.
  // deepseek-v4-pro comes next (longest drafts, broke JSON on rewrites on 2026-10-03), then qwen3.7-max as the last resort.
  "glm-5.1": [...DEEPSEEK, "qwen3.7-max"],
  // Kept for any caller that still names them.
  "glm-5.2": ["glm-5.1", ...DEEPSEEK, "qwen3.7-max"],
  "qwen3.8-max": [...LARGE, "qwen3.7-max"],
  "qwen3.7-flash": ["glm-5.1", "qwen-flash"],
  "qwen-flash": ["glm-5.1", "qwen3.7-flash"],
  // Onboarding, the brand import and the memory check (thinking off). Dated snapshots carry their own free quota, unlike the undated qwen-plus.
  "qwen3.7-plus": ["qwen-plus-2025-09-11", "qwen-flash-2025-07-28"],
};

export function modelChain(primary: string): string[] {
  return [primary, ...(MODEL_FALLBACKS[primary] ?? []).filter((m) => m !== primary)];
}

/**
 * True when the model itself is unavailable to this account, so another
 * model may succeed: free quota used up (AllocationQuota.FreeTierOnly), no
 * balance, model not offered, or rate-limited.
 */
export function isModelUnavailable(status: number, body: string): boolean {
  if (status === 429) return true;
  if (status < 400 || status >= 500) return false;
  return /FreeTierOnly|AllocationQuota|free tier|quota|Arrearage|insufficient.?balance|model.?not.?found|does not exist|not supported|Throttling/i.test(body);
}

/** Leaves time for the answer after the last attempt starts. */
const ATTEMPT_TIMEOUT_MS = 150_000;
const TOTAL_BUDGET_MS = 270_000;

export interface ChainResult {
  status: number;
  body: string;
  model: string;
  /** Models that were unavailable before `model` answered. */
  skipped: { model: string; status: number; error: string }[];
  /** What the answer cost at list price, in USD (see src/lib/ai/cost.ts). */
  costUsd: number;
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export async function chatWithFallback(
  payload: object,
  apiKey: string,
  { fetchImpl = fetch as Fetch, now = Date.now } = {}
): Promise<ChainResult> {
  const started = now();
  const chain = modelChain(String((payload as { model?: unknown }).model ?? ""));
  const skipped: ChainResult["skipped"] = [];

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const left = TOTAL_BUDGET_MS - (now() - started);
    const res = await fetchImpl(DASHSCOPE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, model }),
      signal: AbortSignal.timeout(Math.max(10_000, Math.min(ATTEMPT_TIMEOUT_MS, left))),
    });
    const body = await res.text();
    const last = i === chain.length - 1 || TOTAL_BUDGET_MS - (now() - started) < 30_000;
    if (!res.ok && isModelUnavailable(res.status, body) && !last) {
      skipped.push({ model, status: res.status, error: body.slice(0, 300) });
      console.warn(`[llm] ${model} unavailable (${res.status}); falling back to ${chain[i + 1]}`);
      continue;
    }
    const costUsd = res.ok ? callCostUsd(model, body) : 0;
    recordCost(costUsd);
    return { status: res.status, body, model, skipped, costUsd };
  }
  // Unreachable: the loop always returns on its last model.
  throw new Error("empty model chain");
}
