import { describe, expect, it } from "vitest";
import { parseModelJson } from "./modelJson";
import { runCodeNode } from "@/test/n8n/harness";

const RAW = '```json\n{"hook": "Two lines.\nSecond line", "body": "Para one.\n\nPara two\twith tab", "claims": []}\n```';

describe("parseModelJson", () => {
  it("parses clean JSON unchanged", () => {
    expect(parseModelJson('{"a":"b\\nc"}')).toEqual({ a: "b\nc" });
  });

  it("repairs raw line breaks and tabs inside strings", () => {
    expect(parseModelJson(RAW)).toEqual({ hook: "Two lines.\nSecond line", body: "Para one.\n\nPara two\twith tab", claims: [] });
  });

  it("keeps escaped quotes and backslashes intact", () => {
    expect(parseModelJson('{"a": "say \\"hi\\"\nnow \\\\ ok"}')).toEqual({ a: 'say "hi"\nnow \\ ok' });
  });

  it("still rejects text that is not JSON", () => {
    expect(() => parseModelJson("not json")).toThrow();
  });
});

describe("02 parse nodes", () => {
  const D = "02_idea_to_asset";
  const nodes = { "Select Target": [{ idea_id: "IDEA-1" }], "Parse Strategy JSON": [{ strategy: { title: "t" } }] };
  const reply = (content: string) => ({ choices: [{ message: { content } }] });

  it("Parse Editor Output reads a reply with raw line breaks, like parseModelJson", async () => {
    const [out] = await runCodeNode(D, "Parse Editor Output", { input: [reply(RAW)], nodes });
    expect(out.edited_body).toBe((parseModelJson(RAW) as { body: string }).body);
  });

  it("Parse Editor Output fails the run on an empty or missing edit, instead of passing an empty draft", async () => {
    await expect(runCodeNode(D, "Parse Editor Output", { input: [reply('{"hook":"h","body":"","claims":[]}')], nodes })).rejects.toThrow(/empty body/);
    await expect(runCodeNode(D, "Parse Editor Output", { input: [{ error: { message: "quota" } }], nodes })).rejects.toThrow(/no completion/);
  });

  it("Parse Strategy JSON and Parse Writer Output fail the run when the model returned nothing", async () => {
    await expect(runCodeNode(D, "Parse Strategy JSON", { input: [{ error: "x" }], nodes })).rejects.toThrow(/no completion/);
    await expect(runCodeNode(D, "Parse Writer Output", { input: [{ error: "x" }], nodes })).rejects.toThrow(/no completion/);
  });
});
