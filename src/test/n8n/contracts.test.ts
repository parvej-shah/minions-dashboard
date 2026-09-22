import { describe, it, expect } from "vitest";
import { runCodeNode, workflowNodes } from "./harness";
import { brandContext, harvestContext } from "./fixtures";
import { thesisKey, isRedundantThesis } from "@/lib/thesis";
import { verbatimGuard } from "@/lib/ai/craftExtract";
import { RUN_CALLBACK_STATUSES, TERMINAL_HERO_STATUSES } from "@/constants/pipelineContracts";

/**
 * Contracts between the dashboard and the n8n workflows. Each test feeds a
 * Code node exactly what the dashboard's own code produces and checks the node
 * uses it -- the failure mode being a field one side renamed or never sent,
 * which n8n does not flag: the prompt just goes out with a blank section.
 */

const H = "01_idea_harvester";

function systemPrompt(out: Record<string, unknown>): string {
  const payload = out.prompt_payload as { messages: { role: string; content: string }[] };
  return payload.messages.find((m) => m.role === "system")!.content;
}

describe("/api/brand/context -> 01_idea_harvester", () => {
  const newRow = { idea_id: "IDEA-0001", status: "NEW", raw_idea: "Water heaters fail in winter" };

  it("Build Refine Payload puts the tenant's priority 1-2 directives in the prompt", async () => {
    // Regression: the node filtered the raw response for a top-level
    // `category`, matched nothing, and refined every idea with an empty
    // "Brand context:" section.
    const [out] = await runCodeNode(H, "Build Refine Payload", {
      input: [brandContext()],
      nodes: { "Backlog Guard": [{ existing_rows: [newRow] }] },
    });
    const prompt = systemPrompt(out);
    expect(prompt).toContain("[POSITIONING] core_positioning: We fix it the same day or the visit is free.");
    expect(prompt).toContain("[FORBIDDEN] no_fear_selling:");
    expect(prompt).not.toContain("low_priority_note");
    expect(prompt).not.toContain("inactive_rule");
  });

  it("Build Harvest Payload uses this run's pillar rotation and the author standing", async () => {
    const ctx = brandContext();
    const [out] = await runCodeNode(H, "Build Harvest Payload", {
      input: [{ title: "Pipes freeze", link: "https://news.example/a", contentSnippet: "Cold snap" }],
      nodes: { "Fetch Brand Context": [ctx] },
    });
    const prompt = systemPrompt(out);
    for (const angle of harvestContext.pillarRotation) {
      expect(prompt).toContain(angle.pillar);
      expect(prompt).toContain(angle.brief);
    }
    expect(prompt).toContain(ctx.writer_expertise_guidance);
    expect(prompt).toContain("Same-day plumbing for homeowners in Columbus.");
  });

  it("Build Harvest Payload refuses degraded context instead of harvesting on fallbacks", async () => {
    await expect(
      runCodeNode(H, "Build Harvest Payload", {
        input: [{}],
        nodes: { "Fetch Brand Context": [brandContext({ degraded: ["idea_sources"] })] },
      })
    ).rejects.toThrow(/degraded/);
  });

  it("Expand Tenant Sources emits one feed per tenant source", async () => {
    const out = await runCodeNode(H, "Expand Tenant Sources", {
      nodes: { "Fetch Brand Context": [brandContext()] },
    });
    expect(out.map((o) => o.feed_url)).toEqual(harvestContext.sources.map((s) => s.feed_url));
  });
});

describe("logic duplicated between n8n and src/lib", () => {
  const recent = [
    { raw_idea: "Water heaters fail in winter because sediment builds up", angle: "Flush the tank every year" },
  ];
  const candidates = [
    // Same argument, reworded.
    { raw_idea: "Sediment buildup is why water heaters fail each winter", angle: "Flush tanks yearly" },
    // A different argument.
    { raw_idea: "Low-flow toilets clog more when drain slope is wrong", angle: "Check slope before replacing" },
  ];

  it("Dedupe Ideas agrees with isRedundantThesis in src/lib/thesis.ts", async () => {
    const ctx = { ...brandContext(), recent_theses: recent.map((r) => thesisKey(r.raw_idea, r.angle)) };
    const out = await runCodeNode(H, "Dedupe Ideas", {
      input: candidates,
      nodes: { "Fetch Brand Context": [ctx], "Backlog Guard": [{ existing_rows: [] }] },
    });
    const kept = new Set(out.map((o) => o.raw_idea));
    for (const c of candidates) {
      const redundant = isRedundantThesis(
        { rawIdea: c.raw_idea, angle: c.angle },
        recent.map((r) => ({ thesisKey: thesisKey(r.raw_idea, r.angle) }))
      );
      expect(kept.has(c.raw_idea)).toBe(!redundant);
    }
    for (const o of out) expect(o.thesis_key).toBe(thesisKey(o.raw_idea as string, o.angle as string));
  });

  it("Merge Craft Into Ideas applies the same verbatim guard as craftExtract.ts", async () => {
    const source = "The fastest way to lose a customer is to show up late without calling ahead first thing.";
    const notes = "Opens with a warning. The fastest way to lose a customer is to show up late without calling. Closes on a checklist.";
    const idea = { raw_idea: "x", source_url: "https://news.example/a" };
    const [out] = await runCodeNode(H, "Merge Craft Into Ideas", {
      nodes: {
        "Dedupe Ideas": [idea],
        "Build Craft Payload": [{ skip_craft: false, article_urls: [idea.source_url], article_texts: [source] }],
        "Qwen Craft Notes": [{ choices: [{ message: { content: JSON.stringify({ notes: [{ index: 1, craft_notes: notes }] }) } }] }],
      },
    });
    expect(out.craft_notes).toBe(verbatimGuard(notes, source));
    expect(out.craft_notes).toContain("[…]");
  });
});

describe("n8n -> dashboard callbacks", () => {
  it("every run callback sends a status /api/pipeline/runs/[id] accepts", () => {
    const allowed: readonly string[] = RUN_CALLBACK_STATUSES;
    let checked = 0;
    for (const slug of ["01_idea_harvester", "02_idea_to_asset", "00c_pipeline_error_alert"]) {
      for (const node of workflowNodes(slug)) {
        if (!String(node.parameters.url ?? "").includes("callback_url")) continue;
        const status = String(node.parameters.jsonBody ?? "").match(/status:\s*'([A-Z_]+)'/)?.[1];
        expect(status, `${slug} › ${node.name}`).toBeDefined();
        expect(allowed, `${slug} › ${node.name}`).toContain(status);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(5);
  });

  const hero = { "Read Hero Request": [{ asset_id: "a1", app_url: "https://app.example", callback_secret: "s" }] };

  it.each([
    ["uploaded to R2", { "Qwen Image 3.0 Pro Generation": [{ output: { choices: [{ message: { content: [{ image: "https://oss.example/x.png" }] } }] } }], "Upload Hero to R2": [{ url: "https://r2.example/x.webp" }] }, "READY"],
    ["safety refusal", { "Qwen Image 3.0 Pro Generation": [{ code: "DataInspectionFailed" }], "Qwen Image Safe Retry": [{ code: "DataInspectionFailed" }], "Upload Hero to R2": [{}] }, "BLOCKED_BY_SAFETY"],
    ["upload failed", { "Qwen Image 3.0 Pro Generation": [{ output: { choices: [{ message: { content: [{ image: "https://oss.example/x.png" }] } }] } }], "Upload Hero to R2": [{ error: "timeout" }] }, "FAILED"],
  ])("Resolve Hero Outcome (%s) sends what /api/internal/assets/hero accepts", async (_label, nodes, expected) => {
    const [out] = await runCodeNode("04_hero_image", "Resolve Hero Outcome", { nodes: { ...hero, ...nodes } });
    expect(TERMINAL_HERO_STATUSES).toContain(out.hero_status);
    expect(out.hero_status).toBe(expected);
    // The route rejects READY without an https URL; an expiring provider URL must never be sent as READY.
    if (out.hero_status === "READY") expect(String(out.hero_image_url)).toMatch(/^https:\/\/r2\.example/);
    else expect(out.hero_image_url).toBeNull();
  });
});
