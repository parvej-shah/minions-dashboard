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

  it("sits after Mark_Write_OK, ends the run, and its failure never stops it", () => {
    expect(conns.Mark_Write_OK.main?.[0]?.map((t) => t.node)).toEqual(["Publish_to_Instagram"]);
    expect(conns.Publish_to_Instagram?.main?.[0] ?? []).toEqual([]);
    expect((ig as { onError?: string }).onError).toBe("continueRegularOutput");
  });

  it("sends no Telegram alert (dashboard shows failures instead)", () => {
    expect(nodes.some((n) => /telegram/i.test(n.name) || /telegram/i.test(String(n.type)))).toBe(false);
  });

  it("reports a Facebook or LinkedIn failure with its reason, and nothing when they worked", async () => {
    const blog = { Blog_Result: [{ asset_id: "a1" }] };
    const [fbOk] = await runCodeNode(slug, "Normalize_Facebook_Published", { nodes: { ...blog, Publish_to_Facebook_Photo: [{ post_id: "p1" }] } });
    expect(fbOk).toMatchObject({ facebook_post_id: "p1", facebook_error: null });
    const [fbBad] = await runCodeNode(slug, "Normalize_Facebook_Published", { nodes: { ...blog, Publish_to_Facebook_Photo: [{ error: { message: "Invalid OAuth access token" } }] } });
    expect(fbBad).toMatchObject({ facebook_post_id: null, facebook_error: "Invalid OAuth access token" });
    const [liOk] = await runCodeNode(slug, "Normalize_LinkedIn_Published", { nodes: { Publish_to_LinkedIn: [{ headers: { "x-restli-id": "urn:li:share:1" }, statusCode: 201 }] } });
    expect(liOk).toMatchObject({ linkedin_post_id: "urn:li:share:1", linkedin_error: null });
    const [liBad] = await runCodeNode(slug, "Normalize_LinkedIn_Published", { nodes: { Publish_to_LinkedIn: [{ statusCode: 401, body: { message: "The token used in the request has expired" } }] } });
    expect(liBad).toMatchObject({ linkedin_post_id: null, linkedin_error: "The token used in the request has expired" });
  });

  it("writes the failures with the published record", () => {
    const body = String(nodes.find((n) => n.name === "Mark_Asset_Published_DB")!.parameters.jsonBody);
    expect(body).toContain("publish_failures");
    expect(body).toContain("facebook_error");
    expect(body).toContain("linkedin_error");
  });
});
