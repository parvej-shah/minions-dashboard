import { describe, expect, it } from "vitest";
import { callCostUsd, recordCost, withCostMeter } from "./cost";

const reply = (prompt_tokens: number, completion_tokens: number) => JSON.stringify({ choices: [], usage: { prompt_tokens, completion_tokens } });

describe("callCostUsd", () => {
  it("prices input and output tokens at the model's list price", () => {
    expect(callCostUsd("glm-5.2", reply(1_000_000, 1_000_000))).toBeCloseTo(5.8);
    expect(callCostUsd("qwen-flash-2025-07-28", reply(1_000_000, 0))).toBeCloseTo(0.05);
  });

  it("prices an unknown model like the dearest large one, and a reply without usage at 0", () => {
    expect(callCostUsd("mystery-model", reply(1_000_000, 0))).toBeCloseTo(2.5);
    expect(callCostUsd("glm-5.2", "{}")).toBe(0);
    expect(callCostUsd("glm-5.2", "not json")).toBe(0);
  });
});

describe("withCostMeter", () => {
  it("adds up the costs recorded inside it, and only those", async () => {
    recordCost(9);
    const { value, costUsd } = await withCostMeter(async () => {
      recordCost(0.01);
      await Promise.all([Promise.resolve().then(() => recordCost(0.02)), Promise.resolve()]);
      return "done";
    });
    expect(value).toBe("done");
    expect(costUsd).toBeCloseTo(0.03);
  });
});
