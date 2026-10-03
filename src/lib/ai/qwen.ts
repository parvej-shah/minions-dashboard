import { optionalEnv, requireEnv } from "@/lib/env";
import { chatWithFallback, type ChainResult } from "@/lib/ai/modelChain";

type ChainOptions = NonNullable<Parameters<typeof chatWithFallback>[2]>;

export const isQwenConfigured = () => Boolean(optionalEnv("DASHSCOPE_API_KEY"));

export function chat(payload: object, options?: ChainOptions): Promise<ChainResult> {
  return chatWithFallback(payload, requireEnv("DASHSCOPE_API_KEY"), options);
}

function completionContent(result: Pick<ChainResult, "status" | "body" | "model">, label: string): string | null {
  if (result.status >= 300) {
    console.warn(`[${label}] ${result.model} answered ${result.status}: ${result.body.slice(0, 200)}`);
    return null;
  }
  return JSON.parse(result.body)?.choices?.[0]?.message?.content ?? null;
}

// For optional model steps: any failure, including a missing key, degrades to null.
export async function chatContent(payload: object, label: string, options?: ChainOptions): Promise<string | null> {
  if (!isQwenConfigured()) return null;
  try {
    return completionContent(await chat(payload, options), label);
  } catch (error) {
    console.warn(`[${label}] model call failed:`, error);
    return null;
  }
}
