import { AsyncLocalStorage } from "node:async_hooks";

/**
 * What a model call costs at Model Studio's international list price (USD per
 * million tokens, lowest tier, 2026-10-03). Most calls run on free quota and
 * are billed nothing while it lasts; the list price is what a post costs once
 * it does not. glm-5.2 is DashScope's price as listed by third parties; Model
 * Studio's own page does not show it. Jev calls are part of the Jev plan and
 * are not counted.
 */
const PRICES: Record<string, { input: number; output: number }> = {
  "glm-5.2": { input: 1.4, output: 4.4 },
  "qwen3-max": { input: 1.2, output: 6 },
  "qwen3.8-max": { input: 2, output: 6 },
  "qwen3.7-max": { input: 2.5, output: 7.5 },
  "qwen3.7-plus": { input: 0.4, output: 1.6 },
  "qwen3.7-flash": { input: 0.03, output: 0.13 },
  "qwen-flash": { input: 0.05, output: 0.4 },
  "deepseek-v3.2": { input: 0.57, output: 1.71 },
  "deepseek-v4-pro": { input: 2.4, output: 4.8 },
  "deepseek-v4-flash": { input: 0.2, output: 0.4 },
};
/** A model missing above is priced like the dearest large model, so a cost is never understated. */
const UNKNOWN = { input: 2.5, output: 7.5 };

/** The cost of one chat completion from its raw reply body; 0 when the body has no usage. */
export function callCostUsd(model: string, body: string): number {
  try {
    const usage = JSON.parse(body)?.usage;
    if (!usage) return 0;
    const price = PRICES[model.replace(/-(\d{4}-\d{2}-\d{2}|\d{4})$/, "")] ?? UNKNOWN;
    return ((Number(usage.prompt_tokens) || 0) * price.input + (Number(usage.completion_tokens) || 0) * price.output) / 1e6;
  } catch {
    return 0;
  }
}

const meter = new AsyncLocalStorage<{ usd: number }>();

/** Adds a call's cost to the meter of the work it runs inside, if any. */
export function recordCost(usd: number): void {
  const m = meter.getStore();
  if (m) m.usd += usd;
}

/** Runs `fn` and returns what its model calls cost, in USD. */
export async function withCostMeter<T>(fn: () => Promise<T>): Promise<{ value: T; costUsd: number }> {
  const m = { usd: 0 };
  const value = await meter.run(m, fn);
  return { value, costUsd: m.usd };
}
