import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { runCodeNode, workflowNodes } from "./harness";

type Connections = Record<string, { main?: ({ node: string }[] | null)[] }>;

function connections(slug: string): Connections {
  return JSON.parse(fs.readFileSync(path.resolve("n8n/workflows", slug, "workflow.json"), "utf8")).connections;
}

describe("03_review_publisher never posts an asset twice", () => {
  const slug = "03_review_publisher";
  const nodes = workflowNodes(slug);
  const conns = connections(slug);
  // Anything that talks to a channel: blog, Facebook, LinkedIn, Instagram.
  const postsExternally = nodes
    .filter((n) => n.type.endsWith(".httpRequest") && /graph\.facebook|api\.linkedin|\$json\.token|rest\/v1\/blogs|api\/internal\/instagram/.test(String(n.parameters.url ?? "")))
    .map((n) => n.name);

  it("finds the publishing nodes it is guarding", () => {
    expect(postsExternally.length).toBeGreaterThanOrEqual(5);
  });

  it("no publishing node is reachable without the published_at claim landing", () => {
    // Walk from every trigger, but only through Claim_Landed's FALSE branch
    // (never the true one): nothing that posts may be reachable that way.
    const triggers = nodes.filter((n) => /(Trigger|\.webhook)$/.test(n.type)).map((n) => n.name);
    const seen = new Set<string>();
    const stack = [...triggers];
    while (stack.length) {
      const name = stack.pop()!;
      if (seen.has(name)) continue;
      seen.add(name);
      const outs = conns[name]?.main ?? [];
      const next = name === "Claim_Landed" ? outs.slice(1) : outs;
      for (const o of next) for (const t of o ?? []) stack.push(t.node);
    }
    expect(postsExternally.filter((n) => seen.has(n))).toEqual([]);
  });

  it("the claim only updates a row that is still unpublished", () => {
    const claim = nodes.find((n) => n.name === "Claim_Asset_For_Publish")!;
    expect(String(claim.parameters.url)).toContain("published_at=is.null");
    expect(String(claim.parameters.method)).toBe("PATCH");
  });

  it("Mark_Write_OK fails loudly on a rejected final write and passes a good one", async () => {
    await expect(
      runCodeNode(slug, "Mark_Write_OK", { input: [{ statusCode: 400, body: { message: "column missing" } }] })
    ).rejects.toThrow(/HTTP 400.*column missing/);
    await expect(runCodeNode(slug, "Mark_Write_OK", { input: [{ statusCode: 204 }] })).resolves.toHaveLength(1);
  });
});

describe("03_review_publisher sends a switched-on carousel as a LinkedIn document", () => {
  const slug = "03_review_publisher";
  const row = { id: "a1", slug: "s", title: "T", content: "Body", hero_image_url: "https://cdn/x.png", linkedin_variant: "Normal post" };
  const filter = (r: Record<string, unknown>) => runCodeNode(slug, "Filter_Approved_Assets", { nodes: { Read_Approved_Assets_DB: [r] } });

  it("uses the PDF, its caption and title when the carousel is on", async () => {
    const [out] = await filter({ ...row, carousel_spec: { active: true, pdf_url: "https://cdn/c.pdf", caption: "Swipe", document_title: "Doc" } });
    expect(out).toMatchObject({ li_media: "DOCUMENT", li_media_url: "https://cdn/c.pdf", li_carousel_caption: "Swipe", li_document_title: "Doc", li_variant: "Normal post" });
  });

  it("keeps the cover image when the carousel is off or has no PDF", async () => {
    for (const spec of [null, { active: false, pdf_url: "https://cdn/c.pdf" }, { active: true }]) {
      const [out] = await filter({ ...row, carousel_spec: spec });
      expect(out).toMatchObject({ li_media: "IMAGE", li_media_url: "https://cdn/x.png", li_carousel_caption: null });
    }
  });

  it("uploads to the documents endpoint and posts the document URN, falling back to the normal post", () => {
    const nodes = workflowNodes(slug);
    const init = String(nodes.find((n) => n.name === "Initialize_LinkedIn_Image_Upload")!.parameters.url);
    expect(init).toContain("rest/documents?action=initializeUpload");
    const body = String(nodes.find((n) => n.name === "Publish_to_LinkedIn")!.parameters.jsonBody);
    expect(body).toContain("v.document");
    expect(body).toContain("isDoc && urn ? a.li_carousel_caption : a.li_variant");
  });
});


describe("03_review_publisher posts to Instagram once the publish record is saved", () => {
  const slug = "03_review_publisher";
  const nodes = workflowNodes(slug);
  const conns = connections(slug);
  const ig = nodes.find((n) => n.name === "Publish_to_Instagram")!;

  it("calls the dashboard's Instagram publisher with the asset id", () => {
    expect(String(ig.parameters.url)).toBe("https://minions.getminions.ai/api/internal/instagram/publish");
    expect(String(ig.parameters.method)).toBe("POST");
    expect(String(ig.parameters.jsonBody)).toContain("$('Merge_Publish_Results').item.json.asset_id");
  });

  it("sits between Mark_Write_OK and the alert, and its failure never stops the run", () => {
    expect(conns.Mark_Write_OK.main?.[0]?.map((t) => t.node)).toEqual(["Publish_to_Instagram"]);
    expect(conns.Publish_to_Instagram.main?.[0]?.map((t) => t.node)).toEqual(["Prepare_Telegram_Alert"]);
    expect((ig as { onError?: string }).onError).toBe("continueRegularOutput");
  });

  it("tells the alert whether Instagram went out", async () => {
    const base = { Normalize_Facebook_Published: [{ asset_id: "a1", facebook_enabled: true }], Normalize_LinkedIn_Published: [{ linkedin_enabled: true }] };
    const [posted] = await runCodeNode(slug, "Prepare_Telegram_Alert", { nodes: { ...base, Publish_to_Instagram: [{ ok: true, media_id: "m1" }] } });
    expect(posted).toMatchObject({ asset_id: "a1", instagram_status: "Published" });
    const [skipped] = await runCodeNode(slug, "Prepare_Telegram_Alert", { nodes: { ...base, Publish_to_Instagram: [{ ok: true, skipped: "not_connected" }] } });
    expect(skipped).toMatchObject({ instagram_status: "Skipped (not_connected)" });
    const [failed] = await runCodeNode(slug, "Prepare_Telegram_Alert", { nodes: { ...base, Publish_to_Instagram: [{ ok: false, error: "no permission" }] } });
    expect(failed).toMatchObject({ instagram_status: "Failed: no permission" });
  });
});
