/**
 * The body n8n posts to DashScope's OpenAI-compatible chat endpoint.
 * Rendered here, sent unchanged by the "Qwen …" HTTP nodes.
 */
export interface ChatPayload {
  model: string;
  enable_thinking: false;
  temperature: number;
  max_tokens: number;
  messages: { role: "system" | "user"; content: string }[];
}

export type Json = Record<string, unknown>;

/** Reads a string field, treating anything else as missing. */
export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
