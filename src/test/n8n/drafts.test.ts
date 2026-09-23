import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { runCodeNode, workflowNodes } from "./harness";
import { draftAuthor } from "./fixtures";
import { checkDraft } from "@/lib/drafts/check";

/**
 * Phase 4 of docs/product/authority-flywheel-plan.md, through the real 02
 * Code nodes: the author context reaches the prompts, the dashboard's draft
 * check decides claims_ok, and test drafts can skip the cover image.
 */

const D = "02_idea_to_asset";
type Json = Record<string, unknown>;
const nodes = workflowNodes(D) as (ReturnType<typeof workflowNodes>[number] & { executeOnce?: boolean })[];
const node = (name: string) => nodes.find((n) => n.name === name)!;
const conn = (from: string) => {
  const wf = JSON.parse(fs.readFileSync(`n8n/workflows/${D}/workflow.json`, "utf8"));
  return (wf.connections[from]?.main ?? []).map((o: { node: string }[]) => (o ?? []).map((c) => c.node));
};

describe("02 fetches the author context and runs the dashboard's draft check", () => {
  it("wires Fetch Author Context before Assemble Brand Context, and Check Draft before the claims gate", () => {
    expect(conn("Fetch Tone Examples")[0]).toEqual(["Fetch Author Context"]);
    expect(conn("Fetch Author Context")[0]).toEqual(["Assemble Brand Context"]);
    expect(conn("Parse Editor Output")[0]).toEqual(["Check Draft"]);
    expect(conn("Check Draft")[0]).toEqual(["Parse Claims and Gate"]);
    expect(node("Fetch Author Context").parameters.url).toBe("https://minions.getminions.ai/api/internal/drafts/context");
    expect(node("Check Draft").parameters.url).toBe("https://minions.getminions.ai/api/internal/drafts/check");
  });

  it("Assemble Brand Context passes the author context and standing to the strategist", async () => {
    const [out] = await runCodeNode(D, "Assemble Brand Context", {
      nodes: {
        "Fetch Brand Context": [{ brand_name: "Acme" }],
        "Read Brand": [],
        "Fetch Tone Examples": [],
        "Select Target": [{ idea_id: "IDEA-1", pillar: "What Went Wrong" }],
        "Generate run_id": [{ client_id: "tenant-acme" }],
        "Fetch Author Context": [{ author: draftAuthor as unknown as Json }],
      },
    });
    const inputs = out.prompt_inputs as Json;
    expect((inputs.author as Json).hook).toEqual(draftAuthor.hook);
    expect(inputs.writer_standing).toBe(draftAuthor.writer_standing);
    expect(out.author).toEqual(draftAuthor);
  });

  it("Parse Claims and Gate takes the verdict, claims, notes and reflowed body from the check", async () => {
    const check = checkDraft({
      hook: "h",
      body: "One is long enough here. Two is long enough here. Three is long enough here. Flushing could cut failures by 40%.",
      claims: [{ claim_text: "Flushing could cut failures by 40%", claim_type: "OPINION" }],
      approvedProofs: [],
      allowCustomerResult: false,
      trustBasis: [],
      memory: [],
      knownText: [],
    });
    const [out] = await runCodeNode(D, "Parse Claims and Gate", {
      input: [check as unknown as Json],
      nodes: { "Parse Editor Output": [{ hook: "h", edited_body: "unused", strategy: { title: "T" }, idea: { idea_id: "IDEA-1" } }], "Assemble Brand Context": [{}], "Select Target": [{ idea_id: "IDEA-1" }] },
    });
    expect(out.claims_ok).toBe("BLOCKED");
    expect(String((out.review_notes as string[])[0])).toMatch(/40/);
    expect(out.edited_body).toBe(check.body);
    expect(out.edited_body).toContain("\n\n");
  });

  it("Parse Claims and Gate fails the run when the check gave no verdict", async () => {
    await expect(
      runCodeNode(D, "Parse Claims and Gate", { input: [{ error: "boom" }], nodes: { "Parse Editor Output": [{}], "Assemble Brand Context": [{}] } })
    ).rejects.toThrow(/no verdict/);
  });

  it("Sync Asset to DB writes the review notes and the idea's pillar, never 'Operations'", () => {
    const body = String(node("Sync Asset to DB").parameters.jsonBody);
    expect(body).toContain("review_notes: row.review_notes || []");
    expect(body).not.toContain("'Operations'");
  });
});

describe("test drafts skip the cover image", () => {
  it("Generate run_id carries skip_hero from the trigger", async () => {
    const [on] = await runCodeNode(D, "Generate run_id", { input: [{ body: { client_id: "c1", skip_hero: true } }] });
    const [off] = await runCodeNode(D, "Generate run_id", { input: [{ body: { client_id: "c1" } }] });
    expect(on.skip_hero).toBe(true);
    expect(off.skip_hero).toBe(false);
  });

  it("the cover is dispatched only through Cover Wanted?", () => {
    expect(conn("Asset Write OK?")[0]).toContain("Cover Wanted?");
    expect(conn("Asset Write OK?")[0]).not.toContain("Dispatch Hero Generation");
    expect(conn("Cover Wanted?")[0]).toEqual(["Dispatch Hero Generation"]);
    expect(conn("Cover Wanted?")[1] ?? []).toEqual([]);
    expect(JSON.stringify(node("Cover Wanted?").parameters)).toContain("skip_hero");
  });
});
