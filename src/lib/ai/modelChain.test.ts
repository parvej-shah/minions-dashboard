import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chatWithFallback, isModelUnavailable, modelChain, MODEL_FALLBACKS, USED_UP } from "./modelChain";

const QUOTA = JSON.stringify({ error: { code: "AllocationQuota.FreeTierOnly", message: "The free tier of the model has been exhausted." } });
const OK = (model: string) => JSON.stringify({ model, choices: [{ message: { content: "{}" } }] });

/** A fake DashScope: each model answers with the given status and body. */
function fakeFetch(answers: Record<string, [number, string]>) {
  const calls: string[] = [];
  const fetchImpl = async (_url: string, init: RequestInit) => {
    const model = JSON.parse(String(init.body)).model as string;
    calls.push(model);
    const [status, body] = answers[model] ?? [200, OK(model)];
    return new Response(body, { status });
  };
  return { fetchImpl, calls };
}

describe("model fallback", () => {
  it("uses the primary model when it answers", async () => {
    const { fetchImpl, calls } = fakeFetch({});
    const r = await chatWithFallback({ model: "qwen3.8-max", messages: [] }, "k", { fetchImpl });
    expect(r).toMatchObject({ status: 200, model: "qwen3.8-max", skipped: [] });
    expect(calls).toEqual(["qwen3.8-max"]);
  });

  it("moves down the chain when the free quota is used up, keeping the rest of the payload", async () => {
    const { fetchImpl, calls } = fakeFetch({ "qwen3.8-max-0902": [403, QUOTA], "deepseek-v4-pro-0813": [403, QUOTA] });
    const r = await chatWithFallback({ model: "qwen3.8-max-0902", temperature: 0.7, messages: [{ role: "user", content: "x" }] }, "k", { fetchImpl });
    expect(r.model).toBe("qwen3.8-max");
    expect(r.status).toBe(200);
    expect(r.skipped.map((s) => s.model)).toEqual(["qwen3.8-max-0902", "deepseek-v4-pro-0813"]);
    expect(calls).toEqual(["qwen3.8-max-0902", "deepseek-v4-pro-0813", "qwen3.8-max"]);
  });

  it("runs the large stages on models with free quota, ending on one that lasts longest", () => {
    expect(modelChain("qwen3.8-max-0902")).toEqual(["qwen3.8-max-0902", "deepseek-v4-pro-0813", "qwen3.8-max", "deepseek-v4-pro", "qwen3.7-max", "deepseek-v4.1-flash-1017"]);
    expect(modelChain("deepseek-v4.1-flash")).toEqual(["deepseek-v4.1-flash", "deepseek-v4.1-flash-1017", "qwen3.7-flash"]);
    for (const m of [...modelChain("qwen3.8-max-0902"), ...modelChain("deepseek-v4.1-flash")]) expect(USED_UP.includes(m), `${m} is used up`).toBe(false);
  });

  it("sends a caller that still names a used-up model on to the new chain", () => {
    expect(modelChain("glm-5.1")).toEqual(["glm-5.1", ...modelChain("qwen3.8-max-0902")]);
    expect(modelChain("qwen3.8-flash")).toEqual(["qwen3.8-flash", ...modelChain("deepseek-v4.1-flash")]);
  });

  it("returns any other error as it is, without switching model", async () => {
    const { fetchImpl, calls } = fakeFetch({ "qwen3.8-max": [400, JSON.stringify({ error: { code: "InvalidParameter", message: "bad messages" } })] });
    const r = await chatWithFallback({ model: "qwen3.8-max" }, "k", { fetchImpl });
    expect(r.status).toBe(400);
    expect(calls).toEqual(["qwen3.8-max"]);
  });

  it("does not hide a server error behind another model", async () => {
    const { fetchImpl, calls } = fakeFetch({ "qwen3.8-max": [503, "overloaded quota"] });
    expect((await chatWithFallback({ model: "qwen3.8-max" }, "k", { fetchImpl })).status).toBe(503);
    expect(calls).toHaveLength(1);
  });

  it("returns the last model's refusal when the whole chain is used up", async () => {
    const all = Object.fromEntries(modelChain("qwen-flash").map((m) => [m, [403, QUOTA] as [number, string]]));
    const { fetchImpl, calls } = fakeFetch(all);
    const r = await chatWithFallback({ model: "qwen-flash" }, "k", { fetchImpl });
    expect(r.status).toBe(403);
    expect(calls).toEqual(modelChain("qwen-flash"));
  });

  it("stops falling back when the time budget is nearly spent", async () => {
    let t = 0;
    const { fetchImpl, calls } = fakeFetch({ "qwen3.8-max": [429, "Throttling"] });
    const r = await chatWithFallback({ model: "qwen3.8-max" }, "k", { fetchImpl, now: () => (t += 130_000) });
    expect(r.status).toBe(429);
    expect(calls).toEqual(["qwen3.8-max"]);
  });

  it("recognises DashScope's ways of saying the model is unavailable", () => {
    expect(isModelUnavailable(403, QUOTA)).toBe(true);
    expect(isModelUnavailable(400, '{"error":{"code":"Arrearage"}}')).toBe(true);
    expect(isModelUnavailable(404, '{"error":{"message":"The model `x` does not exist"}}')).toBe(true);
    expect(isModelUnavailable(429, "")).toBe(true);
    expect(isModelUnavailable(400, '{"error":{"code":"InvalidParameter"}}')).toBe(false);
    expect(isModelUnavailable(500, QUOTA)).toBe(false);
  });

  it("every model a pipeline prompt uses has a fallback chain", () => {
    const dir = path.join(process.cwd(), "src/lib/prompts");
    const models = new Set<string>();
    const files = [...fs.readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => path.join(dir, f)), "src/lib/ai/brandCopilot.ts", "src/lib/ai/memoryCheck.ts"];
    for (const f of files) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/(?:model: |MODEL = )"([^"]+)"/g)) models.add(m[1]);
    }
    expect([...models].sort()).toEqual(["deepseek-v4.1-flash", "qwen3.8-max-0902"]);
    for (const m of models) expect(MODEL_FALLBACKS[m], m).toBeDefined();
    for (const m of models) expect(USED_UP.includes(m), `${m} has no free quota left`).toBe(false);
  });
});
