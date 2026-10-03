import { PROMPT_STAGES, isPromptStage, renderPrompt } from "@/lib/prompts";
import { readJson } from "@/server/http/body";
import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const POST = route<"webhook", { stage: string }>({ auth: "webhook", failure: "Failed to render the prompt" }, async ({ request, params }) => {
  const { stage } = params;
  if (!isPromptStage(stage)) {
    throw new HttpError(404, `Unknown prompt stage "${stage}". Expected one of: ${Object.keys(PROMPT_STAGES).join(", ")}`);
  }
  return renderPrompt(stage, await readJson(request, "Body must be the stage's prompt_inputs object"));
});
