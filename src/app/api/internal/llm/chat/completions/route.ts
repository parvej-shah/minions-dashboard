import { NextResponse } from "next/server";
import { apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { chatWithFallback } from "@/lib/ai/modelChain";

/**
 * Every model call n8n makes goes through here: an OpenAI-compatible chat
 * completion, forwarded to DashScope with model fallback
 * (src/lib/ai/modelChain.ts). The body is the `payload` a Render … Prompt
 * node returned, sent unchanged; the reply is DashScope's own, so the n8n
 * parse nodes read it exactly as before. `x-model-used` says which model
 * answered.
 */

// A slow primary plus a fallback must fit in one invocation.
export const maxDuration = 300;

export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || typeof payload.model !== "string") {
    return apiFailure("Body must be a chat payload with a model", 400);
  }
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return apiFailure("DASHSCOPE_API_KEY is not configured", 500);

  try {
    const result = await chatWithFallback(payload, apiKey);
    return new NextResponse(result.body, {
      status: result.status,
      headers: {
        "Content-Type": "application/json",
        "x-model-used": result.model,
        ...(result.skipped.length ? { "x-model-skipped": result.skipped.map((s) => s.model).join(",") } : {}),
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("[llm] model call failed", error);
    return apiFailure(timedOut ? "The model call timed out" : "The model call failed", timedOut ? 504 : 502);
  }
}
