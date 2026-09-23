import { describe, it, expect } from "vitest";
import { runCodeNode, workflowNodes } from "./harness";

/**
 * The webhook secret: n8n's trigger webhooks require it, n8n sends it back
 * only through its credential, and only to fixed dashboard URLs.
 */

const CRED_ID = "pePrDfuS5BrzrPCk";
const SLUGS = ["00_tenant_dispatcher", "00b_posting_scheduler_dispatcher", "00c_pipeline_error_alert", "01_idea_harvester", "02_idea_to_asset", "03_review_publisher", "04_hero_image"];
const RUN = "cmtvsrrpm000004l8my0ysedg";

type Node = ReturnType<typeof workflowNodes>[number] & { credentials?: Record<string, { id: string }> };
const all = SLUGS.flatMap((slug) => (workflowNodes(slug) as Node[]).map((n) => ({ slug, n })));

describe("n8n webhook authentication", () => {
  it("every trigger webhook requires the Cockpit header credential", () => {
    const hooks = all.filter(({ n }) => n.type.endsWith(".webhook"));
    expect(hooks.length).toBe(4);
    for (const { slug, n } of hooks) {
      expect(n.parameters.authentication, `${slug} > ${n.name}`).toBe("headerAuth");
      expect(n.credentials?.httpHeaderAuth?.id, `${slug} > ${n.name}`).toBe(CRED_ID);
    }
  });

  it("every call to an n8n webhook or back to the dashboard carries the credential", () => {
    const calls = all.filter(({ n }) => n.type.endsWith(".httpRequest") && /n8n\.getminions\.ai\/webhook|minions\.getminions\.ai\/api\//.test(String(n.parameters.url)));
    expect(calls.length).toBeGreaterThan(5);
    for (const { slug, n } of calls) {
      expect(n.parameters.genericAuthType, `${slug} > ${n.name}`).toBe("httpHeaderAuth");
      expect(n.credentials?.httpHeaderAuth?.id, `${slug} > ${n.name}`).toBe(CRED_ID);
    }
  });

  it("run callbacks go to a fixed dashboard URL, never one from the trigger", () => {
    const callbacks = all.filter(({ n }) => /Callback|Mark Run Failed/.test(n.name) && n.type.endsWith(".httpRequest"));
    expect(callbacks.length).toBe(5);
    for (const { slug, n } of callbacks) {
      expect(String(n.parameters.url), `${slug} > ${n.name}`).toMatch(/^=https:\/\/minions\.getminions\.ai\/api\/pipeline\/runs\/\{\{/);
    }
  });
});

describe("the run id that picks the callback URL", () => {
  it.each([
    ["01_idea_harvester", "Resolve Client ID"],
    ["02_idea_to_asset", "Generate run_id"],
  ])("%s > %s accepts a real run id", async (slug, node) => {
    const [out] = await runCodeNode(slug, node, {
      input: [{ body: { client_id: "c1", callback_url: `https://minions.getminions.ai/api/pipeline/runs/${RUN}` } }],
    });
    expect(out.callback_run_id).toBe(RUN);
    expect(out).not.toHaveProperty("callback_secret");
  });

  it.each([
    ["01_idea_harvester", "Resolve Client ID"],
    ["02_idea_to_asset", "Generate run_id"],
  ])("%s > %s refuses an id that could steer the credential elsewhere", async (slug, node) => {
    for (const bad of ["https://evil.example/x/../../internal/assets/hero", "https://minions.getminions.ai/api/pipeline/runs/..%2Finternal", "https://minions.getminions.ai/api/pipeline/runs/a b"]) {
      const [out] = await runCodeNode(slug, node, { input: [{ body: { client_id: "c1", callback_url: bad } }] });
      expect(out.callback_run_id, bad).toBe("");
    }
  });

  it("Resolve Client ID keeps the webhook headers (which carry the secret) out of its output", async () => {
    const [out] = await runCodeNode("01_idea_harvester", "Resolve Client ID", {
      input: [{ headers: { "x-webhook-secret": "s3cret" }, body: { client_id: "c1" } }],
    });
    expect(JSON.stringify(out)).not.toContain("s3cret");
  });

  it("the error workflow marks the run failed using only the validated run id", async () => {
    const runData = { "Generate run_id": [{ data: { main: [[{ json: { callback_run_id: RUN, callback_url: "https://evil.example/" } }]] } }] };
    const [out] = await runCodeNode("00c_pipeline_error_alert", "Format Error Message", {
      input: [{ workflow: { name: "02" }, execution: { id: "1", error: { message: "boom" }, data: { resultData: { runData } } } }],
    });
    expect(out.callback_run_id).toBe(RUN);
    expect(out.has_callback).toBe(true);
    expect(JSON.stringify(out)).not.toContain("evil.example");
  });
});
