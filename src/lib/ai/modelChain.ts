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
 * Free quota on 2026-11-21 (home.qwencloud.com/benefits, Singapore, the new
 * account: 1M tokens per model until 2027-02-13). Models with none: qwen3.8-flash
 * (exhausted), qwen-flash and glm-5.1/glm-5.2 (not offered). A test keeps
 * prompts off these. Not used: kimi-k3* refuse temperature 0.7, glm-5.3 runs
 * only with thinking on.
 */
export const USED_UP = ["glm-5.1", "glm-5.2", "qwen-flash", "qwen3.8-flash"];

/** The large stages (strategist, writer, rewrite, harvest, pulse, craft, carousel, follow-up, cover line). */
export const LARGE_MODEL = "qwen3.8-max-0902";
/** The short stages (editor, scrub, refine, variants) plus brand import, onboarding and the memory check. */
export const SMALL_MODEL = "deepseek-v4.1-flash";

// Each model has its own 1M-token quota, so the chains spread over several.
// Every chain ends on deepseek-v4.1-flash-1017 or qwen3.7-flash (the latter is 25% used).
const LARGE = ["deepseek-v4-pro-0813", "qwen3.8-max", "deepseek-v4-pro", "qwen3.7-max", "deepseek-v4.1-flash-1017"];
const SMALL = ["deepseek-v4.1-flash-1017", "qwen3.7-flash"];

/**
 * Primary model -> what to try after it, in order. A model not listed here
 * has no fallback. Keep every model a prompt in src/lib/prompts names listed
 * (a test checks that).
 */
export const MODEL_FALLBACKS: Record<string, string[]> = {
  // Writer prompt 2026-11-09: valid JSON, 45s.
  [LARGE_MODEL]: LARGE,
  // Editor prompt 2026-11-09: valid JSON in 1.2s and kept to the source.
  [SMALL_MODEL]: SMALL,
  // Models with no quota, kept for any caller that still names them.
  ...Object.fromEntries(["glm-5.1", "glm-5.2"].map((m) => [m, [LARGE_MODEL, ...LARGE]])),
  ...Object.fromEntries(["qwen-flash", "qwen3.8-flash"].map((m) => [m, [SMALL_MODEL, ...SMALL]])),
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
