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
      body: "One is long enough here. Two is long enough here. Three is long enough here. Four is long enough here. Flushing could cut failures by 40%.",
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

describe("covers are drawn in code; there is no AI image path", () => {
  it("the saved asset goes straight to Render Cover", () => {
    expect(conn("Asset Write OK?")[0]).toContain("Render Cover");
    for (const name of ["AI Image Cover?", "Dispatch Hero Generation"]) expect(workflowNodes(D).some((n) => n.name === name), name).toBe(false);
    expect(JSON.stringify(workflowNodes(D))).not.toMatch(/hero-image|AI_IMAGE|cover_mode|skip_hero/);
  });

  it("Generate run_id no longer carries cover_mode or skip_hero", async () => {
    const [out] = await runCodeNode(D, "Generate run_id", { input: [{ body: { client_id: "c1", skip_hero: true, cover_mode: "ai_image" } }] });
    expect(out).not.toHaveProperty("cover_mode");
    expect(out).not.toHaveProperty("skip_hero");
  });

  it("Render Cover posts the asset and the strategist's cover card to the dashboard", () => {
    const p = node("Render Cover").parameters as Record<string, unknown>;
    expect(p.url).toBe("https://minions.getminions.ai/api/internal/covers");
    expect(String(p.jsonBody)).toContain("thumbnail_card");
    expect(String(p.jsonBody)).toContain("asset_id");
  });

  it("Prepare Asset Row always saves the cover PENDING; the renderer settles it", () => {
    const src = fs.readFileSync(`n8n/workflows/${D}/code/prepare-asset-row.js`, "utf8");
    expect(src).toContain("const heroStatus = 'PENDING';");
    expect(src).not.toContain("Skipped: test draft");
  });
});

describe("banned words are reworded before the gate, which still blocks what is left", () => {
  const prepare = (scrub?: Json) =>
    runCodeNode(D, "Prepare Asset Row", {
      nodes: {
        "Parse Variants and Prepare Rows": [
          {
            asset_id: "a1",
            slug: "s",
            title: "T",
            edited_body: "Checks run against a deterministic schema.",
            li_variant: "Only deterministic checks pass.",
            fb_variant: "fb",
            x_variant: "x",
            supabase_payload: { hook: "Hook" },
          },
        ],
        "Parse Claims and Gate": [{ claims_ok: "Y", review_notes: [] }],
        "Generate run_id": [{ client_id: "c1" }],
        "Read Brand": [{ category: "FORBIDDEN", content: "Deterministic" }],
        ...(scrub ? { "Scrub Banned Words": [scrub] } : {}),
      },
    });

  it("wires Scrub Banned Words between the variant check and Prepare Asset Row", () => {
    expect(conn("Validate Social Variants")[0]).toEqual(["Scrub Banned Words"]);
    expect(conn("Scrub Banned Words")[0]).toEqual(["Prepare Asset Row"]);
    const n = node("Scrub Banned Words") as unknown as { onError?: string; parameters: Json };
    expect(n.parameters.url).toBe("https://minions.getminions.ai/api/internal/drafts/scrub");
    expect(n.onError).toBe("continueRegularOutput");
  });

  it("saves the reworded texts, and the draft is no longer blocked", async () => {
    const [row] = await prepare({
      texts: { body: "Checks run against a fixed schema.", li_variant: "Only fixed checks pass.", fb_variant: "fb", x_variant: "x", hook: "Hook" },
      rewritten: [{ from: "a", to: "b" }, { from: "c", to: "d" }],
      remaining: [],
    });
    expect(row).toMatchObject({ content: "Checks run against a fixed schema.", li_variant: "Only fixed checks pass.", claims_ok: "Y", banned_word_hits: [] });
    expect(row.review_notes).toContain("Reworded 2 sentences to avoid banned words");
  });

  it("blocks as before when the scrub failed and returned no texts", async () => {
    const [row] = await prepare({ error: "timeout" });
    expect(row).toMatchObject({ claims_ok: "BLOCKED", banned_word_hits: ["Deterministic"] });
    expect(row.content).toBe("Checks run against a deterministic schema.");
  });
});

describe("02 writes an Instagram caption next to the other three", () => {
  const variantsReply = (parsed: Json) => ({ choices: [{ message: { content: JSON.stringify(parsed) } }] });
  const parse = (parsed: Json) =>
    runCodeNode(D, "Parse Variants and Prepare Rows", {
      input: [variantsReply(parsed)],
      nodes: {
        "Parse Claims and Gate": [{ title: "T", hook: "Hook", edited_body: "Body", audience: "ICP", asset_id: "a1", claims: [] }],
        "Parse Strategy JSON": [{ strategy: {} }],
      },
    });
  const validate = (data: Json) =>
    runCodeNode(D, "Validate Social Variants", {
      input: [data],
      nodes: { "Assemble Brand Context": [{ company_name: "Acme" }], "Read Brand": [] },
    });
  const three = { li_variant: "li #One #Two", fb_variant: "fb", x_variant: "x" };

  it("Parse Variants reads and cleans ig_variant", async () => {
    const [out] = await parse({ ...three, ig_variant: "**Missed calls** cost tours.\n\n#A #B #C" });
    expect(out.ig_variant).toBe("Missed calls cost tours.\n\n#A #B #C");
  });

  it("an Instagram caption that breaks a rule is a warning, never a block", async () => {
    const [bad] = await validate({ ...three, ig_variant: "See https://x.co #A" });
    expect(bad.variants_ok).toBe("Y");
    expect(bad.variants_warnings).toEqual(expect.arrayContaining(["Instagram caption has a link; links in captions do not click.", "Instagram caption has 1 hashtags; use 3 to 5."]));
    const [missing] = await validate(three);
    expect(missing.variants_ok).toBe("Y");
    expect(missing.variants_warnings).toContain("Instagram caption is empty.");
  });

  it("the caption is scrubbed, scanned for banned words, and saved as instagram_variant", async () => {
    expect(String(node("Scrub Banned Words").parameters.jsonBody)).toContain("ig_variant: p.ig_variant || ''");
    expect(String(node("Sync Asset to DB").parameters.jsonBody)).toContain("instagram_variant: row.ig_variant || null");
    const [row] = await runCodeNode(D, "Prepare Asset Row", {
      nodes: {
        "Parse Variants and Prepare Rows": [{ asset_id: "a1", slug: "s", title: "T", edited_body: "Body", ...three, ig_variant: "Uses a deterministic word.", supabase_payload: { hook: "Hook" } }],
        "Parse Claims and Gate": [{ claims_ok: "Y", review_notes: [] }],
        "Generate run_id": [{ client_id: "c1" }],
        "Read Brand": [{ category: "FORBIDDEN", content: "Deterministic" }],
        "Scrub Banned Words": [{ texts: { ig_variant: "Uses a fixed word." }, rewritten: [], remaining: [] }],
      },
    });
    expect(row).toMatchObject({ ig_variant: "Uses a fixed word.", banned_word_hits: [] });
  });
});
