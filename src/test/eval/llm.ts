/**
 * Model calls for the evals. Straight to DashScope, never through the
 * fallback chain, so a result always measures the model the prompt names.
 */
type Json = Record<string, unknown>;

const ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

export function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

export async function chat(payload: Json): Promise<Json> {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) throw new Error("DASHSCOPE_API_KEY is not set (run with --env-file=.env.local)");
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180_000),
    });
    if (res.ok) return (await res.json()) as Json;
    if (attempt >= 3 || res.status < 500) throw new Error(`DashScope ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** The reply text, without markdown fences. */
export function content(response: Json): string {
  const choices = response.choices as { message?: { content?: string } }[] | undefined;
  return (choices?.[0]?.message?.content ?? "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}
