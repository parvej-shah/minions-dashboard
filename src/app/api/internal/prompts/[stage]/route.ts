import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/server/http/respond";
import { verifyWebhookSecret } from "@/lib/security";
import { PROMPT_STAGES, isPromptStage, renderPrompt } from "@/lib/prompts";

/**
 * Renders a pipeline prompt for n8n.
 *
 * The prompts used to live as template strings inside n8n Code nodes, where
 * no review, test or search could see them. n8n now POSTs the data a stage
 * needs and gets back the exact request body to send the model:
 *
 *   chat stages -> { payload }                     (sent as-is to DashScope)
 *   cover       -> { image_prompt, card_headline }
 *   cover_safe  -> { image_prompt }                 (the refusal fallback)
 *
 * The prompts live in src/lib/prompts; src/test/n8n pins their exact output.
 */
export async function POST(request: Request, { params }: { params: Promise<{ stage: string }> }) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const { stage } = await params;
  if (!isPromptStage(stage)) {
    return apiFailure(`Unknown prompt stage "${stage}". Expected one of: ${Object.keys(PROMPT_STAGES).join(", ")}`, 404);
  }

  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return apiFailure("Body must be the stage's prompt_inputs object", 400);
  }

  try {
    return NextResponse.json(renderPrompt(stage, input));
  } catch (error) {
    return apiError(error, `Failed to render the ${stage} prompt`);
  }
}
