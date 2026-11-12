import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindUnique = vi.fn();
const assetUpdate = vi.fn();
const resolveChannelCredential = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { asset: { findUnique: assetFindUnique, update: assetUpdate } } }));
vi.mock("@/services/channels", () => ({ resolveChannelCredential }));

const { publishToLinkedIn } = await import("./linkedinPublish");

const base = {
  id: "a1", clientId: "c1", status: "PUBLISHED", linkedinPostId: null, linkedinVariant: "Post text", title: "Title",
  heroImageUrl: "https://r2/cover.png", carouselSpec: null, publishFailures: { linkedin: "The token used in the request has expired", instagram: "x" },
};
let calls: { url: string; method: string; body?: unknown }[];
const http = vi.fn(async (url: string, init: { method?: string; body?: unknown } = {}) => {
  calls.push({ url, method: init.method ?? "GET", body: init.body });
  if (url.includes("initializeUpload")) return { ok: true, status: 200, json: async () => ({ value: { uploadUrl: "https://up", image: "urn:li:image:1", document: "urn:li:document:1" } }) };
  if (url === "https://up") return { ok: true, status: 201, json: async () => ({}) };
  if (url.endsWith("/rest/posts")) return { ok: true, status: 201, headers: { get: () => "urn:li:share:99" }, json: async () => ({}) };
  return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(4), json: async () => ({}) };
});
const deps = { http: http as never };

beforeEach(() => {
  vi.clearAllMocks();
  calls = [];
  assetFindUnique.mockResolvedValue(base);
  assetUpdate.mockResolvedValue({});
  resolveChannelCredential.mockResolvedValue({ is_active: true, token: "tok", external_id: "urn:li:person:1" });
});

describe("posting a published draft to LinkedIn again", () => {
  it("posts the cover image, saves the post id and clears only LinkedIn's failure", async () => {
    expect(await publishToLinkedIn("a1", deps)).toEqual({ ok: true, post_id: "urn:li:share:99" });
    const post = calls.find((c) => c.url.endsWith("/rest/posts"))!;
    expect(JSON.parse(String(post.body))).toMatchObject({ author: "urn:li:person:1", commentary: "Post text", content: { media: { id: "urn:li:image:1" } } });
    const data = assetUpdate.mock.calls[0][0].data;
    expect(data.linkedinPostId).toBe("urn:li:share:99");
    expect(data.linkedinPublishedAt).toBeInstanceOf(Date);
    expect(data.publishFailures).toEqual({ instagram: "x" });
  });

  it("posts the carousel PDF as a document with its caption", async () => {
    assetFindUnique.mockResolvedValue({ ...base, carouselSpec: { active: true, pdf_url: "https://r2/c.pdf", caption: "Caption", document_title: "Deck" } });
    await publishToLinkedIn("a1", deps);
    expect(calls[0].url).toContain("documents?action=initializeUpload");
    expect(JSON.parse(String(calls.find((c) => c.url.endsWith("/rest/posts"))!.body))).toMatchObject({ commentary: "Caption", content: { media: { id: "urn:li:document:1", title: "Deck" } } });
  });

  it("keeps LinkedIn's refusal with the post and says how to fix an expired token", async () => {
    http.mockImplementationOnce(async () => ({ ok: false, status: 401, json: async () => ({ message: "The token used in the request has expired" }) }) as never);
    const r = await publishToLinkedIn("a1", deps);
    expect(r).toMatchObject({ ok: false });
    expect((r as { error: string }).error).toMatch(/expired/i);
    expect((r as { error: string }).error).toMatch(/reconnect/i);
    expect(assetUpdate.mock.calls[0][0].data.publishFailures.linkedin).toMatch(/expired/i);
  });

  it("never posts twice, and skips an unconnected or switched-off LinkedIn", async () => {
    assetFindUnique.mockResolvedValue({ ...base, linkedinPostId: "urn:li:share:1" });
    expect(await publishToLinkedIn("a1", deps)).toEqual({ ok: true, skipped: "already_posted" });
    assetFindUnique.mockResolvedValue(base);
    resolveChannelCredential.mockResolvedValue({ is_active: true, token: null, external_id: null });
    expect(await publishToLinkedIn("a1", deps)).toEqual({ ok: true, skipped: "not_connected" });
    resolveChannelCredential.mockResolvedValue({ is_active: false, token: "t", external_id: "u" });
    expect(await publishToLinkedIn("a1", deps)).toEqual({ ok: true, skipped: "channel_off" });
    expect(http).not.toHaveBeenCalled();
  });
});
