import { NextResponse } from "next/server";
import { chatWithFallback } from "@/lib/ai/modelChain";
import { readJson } from "@/server/http/body";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

// A slow primary plus a fallback must fit in one invocation.
export const maxDuration = 300;

// n8n sends the `payload` a Render … Prompt node returned, unchanged; the reply is DashScope's own.
export const POST = route({ auth: "webhook", failure: "The model call failed" }, async ({ request }) => {
  const payload = await readJson(request, "Body must be a chat payload with a model");
  if (typeof payload.model !== "string") throw badRequest("Body must be a chat payload with a model");

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new HttpError(500, "DASHSCOPE_API_KEY is not configured");

  try {
    const result = await chatWithFallback(payload, apiKey);
    return new NextResponse(result.body, {
      status: result.status,
      headers: {
        "Content-Type": "application/json",
        "x-model-used": result.model,
        ...(result.skipped.length ? { "x-model-skipped": result.skipped.map((skipped) => skipped.model).join(",") } : {}),
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    console.error("[llm] model call failed", error);
    throw new HttpError(timedOut ? 504 : 502, timedOut ? "The model call timed out" : "The model call failed");
  }
});
