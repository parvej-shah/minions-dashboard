import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { runCodeNode, readCode, workflowNodes } from "./harness";
import { brandContext, authorContext } from "./fixtures";
import { renderPrompt } from "@/lib/prompts";
import { DEFAULT_LANES } from "@/constants/contentLanes";
import { CONTENT_ANGLES } from "@/constants/contentAngles";
import type { ChatPayload } from "@/lib/prompts/types";

/**
 * Authority flywheel, phases 0 and 1 (docs/product/authority-flywheel-plan.md):
 * tenant zero's values are nobody's defaults, one ICP per tenant, and the
 * ICP / memory / lanes reach n8n.
 */

const H = "01_idea_harvester";
const D = "02_idea_to_asset";
const ROOT = process.cwd();

function llm(content: unknown) {
  return { choices: [{ message: { content: JSON.stringify(content) } }] };
}

describe("/api/brand/context carries the author context", () => {
  it("returns the ICP, active memory and content lanes", () => {
    const ctx = brandContext();
    expect(ctx.icp.decisions).toEqual(authorContext.icp.decisions);
    expect(ctx.professional_memory.map((m) => m.id)).toEqual(["MEM-1", "MEM-2"]);
    expect(ctx.professional_memory[1].disclosure).toBe("GENERALIZE");
    expect(ctx.content_lanes.map((l) => l.name)).toEqual(DEFAULT_LANES.map((l) => l.name));
  });
});

describe("refine assigns the tenant's own lanes, not tenant zero's pillars", () => {
  const rows = [{ idea_id: "IDEA-0001", status: "NEW", raw_idea: "Water heaters fail in winter" }];

  async function build() {
    const [out] = await runCodeNode(H, "Build Refine Payload", {
      input: [brandContext()],
      nodes: { "Backlog Guard": [{ existing_rows: rows }] },
    });
    return out;
  }

  it("offers the tenant's lanes and the shared angle library in the prompt", async () => {
    const { payload } = renderPrompt("refine", (await build()).prompt_inputs) as { payload: ChatPayload };
    const system = payload.messages[0].content;
    for (const lane of DEFAULT_LANES) expect(system).toContain(lane.name);
    for (const angle of CONTENT_ANGLES) expect(system).toContain(angle.pillar);
    // Regression: these four were hardcoded for every tenant.
    for (const old of ["Contractor Realities", "Operational Focus", "AI Strategy"]) expect(system).not.toContain(old);
    expect(system).not.toMatch(/PEER|BRIDGE/);
  });

  it("Parse Refine JSON keeps the person's note and the lane the model chose, and forces ICP", async () => {
    const built = await build();
    const out = await runCodeNode(H, "Parse Refine JSON", {
      input: [llm([{ row_index: 0, angle: "Flush it yearly", lane: "decision guides", pillar: "Decision Guide", audience: "PEER" }])],
      nodes: { "Build Refine Payload": [built] },
    });
    expect(out[0].lane).toBe("decision guides");
    expect(out[0].raw_idea).toBe("Water heaters fail in winter");
    expect(out[0].note).toContain("Water heaters fail in winter");
    expect(out[0].audience).toBe("ICP");
  });

  it("Sync Refined Ideas to DB writes the lane and never a retired audience", () => {
    const body = String(workflowNodes(H).find((n) => n.name === "Sync Refined Ideas to DB")!.parameters.jsonBody);
    expect(body).toContain("lane_id: $json.lane_id || null");
    expect(body).toContain("audience: 'ICP'");
  });
});

describe("no tenant is ever defaulted to tenant zero", () => {
  it.each([
    [H, "Resolve Client ID"],
    [D, "Generate run_id"],
  ])("%s > %s refuses a trigger without client_id", async (slug, node) => {
    await expect(runCodeNode(slug, node, { input: [{ body: {} }] })).rejects.toThrow(/client_id/);
  });

  it("Parse Harvest JSON labels every idea ICP, whatever the model says", async () => {
    const out = await runCodeNode(H, "Parse Harvest JSON", {
      input: [llm({ ideas: [{ raw_idea: "x", angle: "y", audience: "BRIDGE", signal_index: null }] })],
      nodes: { "Build Harvest Payload": [{ market_signals: [] }] },
    });
    expect(out[0].audience).toBe("ICP");
  });

  it("no schema default is one tenant's trade or pillar", () => {
    const schema = fs.readFileSync(path.join(ROOT, "prisma/schema.prisma"), "utf8");
    expect(schema).not.toMatch(/@default\("(HVAC|Contractor Realities)"\)/);
  });

  it("no prompt names tenant zero's pillars or the retired audiences", () => {
    const dir = path.join(ROOT, "src/lib/prompts");
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const src = fs.readFileSync(path.join(dir, file), "utf8");
      expect(src, file).not.toMatch(/Contractor Realities|"PEER"|"BRIDGE"/);
    }
  });

  it("no n8n Code node uses PEER or BRIDGE outside a comment", () => {
    for (const slug of [H, D]) {
      for (const node of workflowNodes(slug).filter((n) => n.type.endsWith(".code"))) {
        const code = readCode(slug, node.name).replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
        expect(code, `${slug} > ${node.name}`).not.toMatch(/PEER|BRIDGE/);
      }
    }
  });

  it("Assemble Brand Context only applies ALL and ICP directives, even for an old PEER idea", async () => {
    const directive = (key: string, audience_scope: string) => ({ category: "VOICE", key, content: key, priority: 1, audience_scope });
    const [out] = await runCodeNode(D, "Assemble Brand Context", {
      nodes: {
        "Fetch Brand Context": [{ brand_name: "Acme" }],
        "Read Brand": [directive("all_rule", "ALL"), directive("icp_rule", "ICP"), directive("peer_rule", "PEER")],
        "Fetch Tone Examples": [],
        "Select Target": [{ idea_id: "IDEA-1", audience: "PEER", pillar: "The Myth" }],
        "Generate run_id": [{ client_id: "tenant-acme" }],
        "Fetch Author Context": [{ author: {} }],
      },
    });
    expect(out.brand_context).toContain("all_rule");
    expect(out.brand_context).toContain("icp_rule");
    expect(out.brand_context).not.toContain("peer_rule");
  });
});

describe("the migration seeds exactly the lanes the code seeds", () => {
  it("every default lane appears in the SQL with the same purpose, brief and weight", () => {
    const sql = fs.readFileSync(path.join(ROOT, "prisma/sql/2026-09-23-authority-foundation.sql"), "utf8");
    for (const l of DEFAULT_LANES) {
      const row = `('${l.slug}',${" ".repeat(Math.max(1, 14 - l.slug.length))}'${l.name}',`;
      const line = sql.split("\n").find((x) => x.includes(`('${l.slug}',`));
      expect(line, `${l.slug} missing from the SQL seed`).toBeTruthy();
      expect(line).toContain(`'${l.name}'`);
      expect(line).toContain(`'${l.purpose}'`);
      expect(line).toContain(`'${l.brief}'`);
      expect(line).toMatch(new RegExp(`, ${l.weight}, ${l.sortOrder}\\)`));
      void row;
    }
  });
});
