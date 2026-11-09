import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { runCodeNode } from "./harness";
import { SCENARIOS } from "./scenarios";
import { renderPrompt } from "@/lib/prompts";

/**
 * Every model prompt, end to end: the real n8n node gathers its inputs, the
 * dashboard renders the prompt from them, and the result must match the
 * golden exactly. A golden diff in review IS the prompt change.
 *
 *   UPDATE_GOLDEN=1 npx vitest run src/test/n8n   # accept an intended change
 */
const GOLDEN_DIR = path.join(__dirname, "golden");
const update = process.env.UPDATE_GOLDEN === "1";

describe("prompt goldens", () => {
  it.each(SCENARIOS.map((s) => [s.name, s] as const))("%s", async (_name, s) => {
    const [out] = await runCodeNode(s.slug, s.node, s.opts);
    const inputs = out.prompt_inputs;
    expect(inputs, `${s.node} emitted no prompt inputs`).toBeTruthy();

    const rendered = renderPrompt(s.stage, inputs);
    const actual = rendered.payload;

    const file = path.join(GOLDEN_DIR, `${s.name}.json`);
    if (update) {
      fs.writeFileSync(file, JSON.stringify(actual, null, 2) + "\n");
      return;
    }
    expect(fs.existsSync(file), `missing golden ${s.name}.json; run with UPDATE_GOLDEN=1`).toBe(true);
    expect(actual).toEqual(JSON.parse(fs.readFileSync(file, "utf8")));
  });
});
