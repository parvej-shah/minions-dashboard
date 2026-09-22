/**
 * Every prompt the content pipeline sends to a model.
 *
 * n8n gathers the data (ideas, brand rows, the previous stage's output) and
 * POSTs it to /api/internal/prompts/<stage>; the prompt itself is built here,
 * so it is versioned, reviewed and tested with the rest of the code. The
 * goldens in src/test/n8n/golden pin the exact text each stage produces.
 */
import { renderCover, renderSafeCover } from "./cover";
import { renderCraft } from "./craft";
import { renderEditor } from "./editor";
import { renderHarvest } from "./harvest";
import { renderRefine } from "./refine";
import { renderStrategist } from "./strategist";
import { renderVariants } from "./variants";
import { renderWriter } from "./writer";

export const PROMPT_STAGES = {
  refine: renderRefine,
  harvest: renderHarvest,
  craft: renderCraft,
  strategist: renderStrategist,
  writer: renderWriter,
  editor: renderEditor,
  variants: renderVariants,
  cover: renderCover,
  cover_safe: renderSafeCover,
} as const;

export type PromptStage = keyof typeof PROMPT_STAGES;

const IMAGE_STAGES = new Set<PromptStage>(["cover", "cover_safe"]);

export function isPromptStage(value: string): value is PromptStage {
  return Object.prototype.hasOwnProperty.call(PROMPT_STAGES, value);
}

/** Renders a stage. Chat stages return { payload }; image stages return { image_prompt, ... }. */
export function renderPrompt(stage: PromptStage, input: unknown): Record<string, unknown> {
  const render = PROMPT_STAGES[stage] as (input: unknown) => unknown;
  const out = render(input);
  return IMAGE_STAGES.has(stage) ? (out as Record<string, unknown>) : { payload: out };
}
