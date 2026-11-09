import { describe, it, expect } from "vitest";
import { readCode, runCodeNode, workflowNodes } from "./harness";
import { SCENARIOS } from "./scenarios";
import { brandContext, harvestContext } from "./fixtures";
import { verbatimGuard } from "@/lib/ai/craftExtract";
import { RUN_CALLBACK_STATUSES } from "@/constants/pipelineContracts";
import { renderPrompt, type PromptStage } from "@/lib/prompts";
import type { ChatPayload } from "@/lib/prompts/types";

/**
 * Contracts between the dashboard and the n8n workflows. Each test feeds a
 * Code node exactly what the dashboard's own code produces and checks the node
 * uses it -- the failure mode being a field one side renamed or never sent,
 * which n8n does not flag: the prompt just goes out with a blank section.
 */

const H = "01_idea_harvester";

/** Renders the node's prompt_inputs the way /api/internal/prompts does. */
function systemPrompt(out: Record<string, unknown>, stage: PromptStage): string {
  const { payload } = renderPrompt(stage, out.prompt_inputs) as { payload: ChatPayload };
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
    const prompt = systemPrompt(out, "refine");
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
    const prompt = systemPrompt(out, "harvest");
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

  it("Build Harvest Payload refuses a context without a harvest plan", async () => {
    await expect(
      runCodeNode(H, "Build Harvest Payload", {
        input: [{}],
        nodes: { "Fetch Brand Context": [{ ...brandContext(), harvest_plan: [] }] },
      })
    ).rejects.toThrow(/harvest_plan/);
  });

  it("Expand Tenant Sources emits one feed per tenant source", async () => {
    const out = await runCodeNode(H, "Expand Tenant Sources", {
      nodes: { "Fetch Brand Context": [brandContext()] },
    });
    expect(out.map((o) => o.feed_url)).toEqual(harvestContext.sources.map((s) => s.feed_url));
  });
});

describe("logic duplicated between n8n and src/lib", () => {
  it("Merge Craft Into Ideas applies the same verbatim guard as craftExtract.ts", async () => {
    const source = "The fastest way to lose a customer is to show up late without calling ahead first thing.";
    const notes = "Opens with a warning. The fastest way to lose a customer is to show up late without calling. Closes on a checklist.";
    const idea = { raw_idea: "x", source_url: "https://news.example/a" };
    const [out] = await runCodeNode(H, "Merge Craft Into Ideas", {
      nodes: {
        "Apply Harvest Gate": [idea],
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
        if (!String(node.parameters.url ?? "").includes("/api/pipeline/runs/")) continue;
        const status = String(node.parameters.jsonBody ?? "").match(/status:\s*'([A-Z_]+)'/)?.[1];
        expect(status, `${slug} › ${node.name}`).toBeDefined();
        expect(allowed, `${slug} › ${node.name}`).toContain(status);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(5);
  });
});

describe("02_idea_to_asset: fields read from Assemble Brand Context", () => {
  // Parse Variants read brand_cream and accent_blue from this node, which never
  // output them, so every cover silently fell back to hardcoded colors while
  // the Brand look editor previewed the tenant's own.
  it("every field a later node reads is one the node actually outputs", async () => {
    const slug = "02_idea_to_asset";
    const reads = new Set<string>();
    for (const n of workflowNodes(slug)) {
      if (typeof n.parameters.jsCode !== "string" || n.name === "Assemble Brand Context") continue;
      const code = readCode(slug, n.name);
      const direct = /\$\('Assemble Brand Context'\)\.first\(\)\??\.json\??\.(\w+)/g;
      for (const m of code.matchAll(direct)) reads.add(m[1]);
      if (/brandCtx\s*=\s*\$\('Assemble Brand Context'\)/.test(code)) {
        for (const m of code.matchAll(/brandCtx\.(\w+)/g)) reads.add(m[1]);
      }
    }
    const strategist = SCENARIOS.find((s) => s.stage === "strategist")!;
    const [out] = await runCodeNode(slug, "Assemble Brand Context", strategist.opts);
    const missing = [...reads].filter((k) => !(k in out));
    expect(reads.size).toBeGreaterThan(5);
    expect(missing, `read downstream but never output: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("model calls", () => {
  it("every chat model call goes through the dashboard's fallback endpoint, never straight to DashScope", () => {
    let checked = 0;
    for (const slug of ["01_idea_harvester", "02_idea_to_asset"]) {
      for (const node of workflowNodes(slug)) {
        const url = String(node.parameters.url ?? "");
        expect(url, `${slug} › ${node.name}`).not.toMatch(/dashscope.*chat\/completions/);
        if (url.endsWith("/api/internal/llm/chat/completions")) checked++;
      }
    }
    expect(checked).toBe(7);
  });
});
