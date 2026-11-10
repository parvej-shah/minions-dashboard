import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindUnique = vi.fn();
const assetUpdate = vi.fn();
const resolveChannelCredential = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { asset: { findUnique: assetFindUnique, update: assetUpdate } } }));
vi.mock("@/services/channels", () => ({ resolveChannelCredential }));

const { publishToInstagram, instagramCaption } = await import("./instagramPublish");

const PAGES = ["https://r2/c/01.jpg", "https://r2/c/02.jpg", "https://r2/c/03.jpg"];
const asset = {
  id: "a1",
  clientId: "c1",
  instagramPostId: null,
  instagramVariant: "Missed calls are booked tours you never see.\n\n#realestate #voiceai #brokerage",
  facebookVariant: "Facebook text",
  heroImageUrl: "https://r2/covers/c1/a1.png",
  carouselSpec: { active: true, pages: PAGES },
};

let calls: { path: string; params: Record<string, string>; method: string }[];
let statusCode: string;
const graph = vi.fn(async (path: string, params: Record<string, string>, method = "POST") => {
  calls.push({ path, params, method });
  if (method === "GET") return { status_code: statusCode };
  if (path.endsWith("/media_publish")) return { id: "ig-media-9" };
  return { id: `container-${calls.length}` };
});
const coverJpeg = vi.fn(async () => "https://r2/covers/c1/a1-ig.jpg");
const deps = { graph, coverJpeg, sleep: async () => {} };

beforeEach(() => {
  vi.clearAllMocks();
  calls = [];
  statusCode = "FINISHED";
  assetFindUnique.mockResolvedValue(asset);
  assetUpdate.mockResolvedValue({});
  resolveChannelCredential.mockResolvedValue({ is_active: true, token: "page-tok", external_id: "ig-1" });
});

describe("publishing a post to Instagram", () => {
  it("posts the carousel pages as one carousel and saves the media id", async () => {
    const r = await publishToInstagram("a1", deps);
    expect(r).toEqual({ ok: true, media_id: "ig-media-9" });
    const creates = calls.filter((c) => c.method === "POST" && c.path === "ig-1/media");
    expect(creates.slice(0, 3).map((c) => c.params)).toEqual(PAGES.map((image_url) => ({ image_url, is_carousel_item: "true", access_token: "page-tok" })));
    expect(creates[3].params).toMatchObject({ media_type: "CAROUSEL", children: "container-1,container-2,container-3", caption: asset.instagramVariant });
    expect(calls.at(-1)).toMatchObject({ path: "ig-1/media_publish", params: { creation_id: "container-4" } });
    expect(assetUpdate).toHaveBeenCalledWith({ where: { id: "a1" }, data: { instagramPostId: "ig-media-9", instagramPublishedAt: expect.any(Date) } });
    expect(coverJpeg).not.toHaveBeenCalled();
  });

  it("posts the cover as a JPEG when the post has no carousel", async () => {
    assetFindUnique.mockResolvedValue({ ...asset, carouselSpec: { active: false, pages: PAGES } });
    const r = await publishToInstagram("a1", deps);
    expect(r).toEqual({ ok: true, media_id: "ig-media-9" });
    expect(coverJpeg).toHaveBeenCalledWith(expect.objectContaining({ id: "a1", clientId: "c1" }));
    const creates = calls.filter((c) => c.method === "POST" && c.path === "ig-1/media");
    expect(creates).toHaveLength(1);
    expect(creates[0].params).toEqual({ image_url: "https://r2/covers/c1/a1-ig.jpg", caption: asset.instagramVariant, access_token: "page-tok" });
  });

  it("takes at most ten carousel pages", async () => {
    const many = Array.from({ length: 12 }, (_, i) => `https://r2/c/${i}.jpg`);
    assetFindUnique.mockResolvedValue({ ...asset, carouselSpec: { active: true, pages: many } });
    await publishToInstagram("a1", deps);
    expect(calls.filter((c) => c.params.is_carousel_item === "true")).toHaveLength(10);
  });

  it("skips when Instagram is off, unconnected, kept off this post, or already posted", async () => {
    resolveChannelCredential.mockResolvedValueOnce({ is_active: false, token: "t", external_id: "ig-1" });
    expect(await publishToInstagram("a1", deps)).toEqual({ ok: true, skipped: "channel_off" });
    resolveChannelCredential.mockResolvedValueOnce({ is_active: true, token: null, external_id: null });
    expect(await publishToInstagram("a1", deps)).toEqual({ ok: true, skipped: "not_connected" });
    resolveChannelCredential.mockResolvedValueOnce({ is_active: false, token: null, external_id: null, post_excluded: true });
    expect(await publishToInstagram("a1", deps)).toEqual({ ok: true, skipped: "post_excluded" });
    assetFindUnique.mockResolvedValueOnce({ ...asset, instagramPostId: "old" });
    expect(await publishToInstagram("a1", deps)).toEqual({ ok: true, skipped: "already_posted" });
    expect(graph).not.toHaveBeenCalled();
    expect(assetUpdate).not.toHaveBeenCalled();
  });

  it("fails without saving when Instagram rejects the media", async () => {
    statusCode = "ERROR";
    const r = await publishToInstagram("a1", deps);
    expect(r.ok).toBe(false);
    expect(calls.some((c) => c.path.endsWith("/media_publish"))).toBe(false);
    expect(assetUpdate).not.toHaveBeenCalled();
  });

  it("reports a Graph error instead of throwing", async () => {
    graph.mockRejectedValueOnce(new Error("(#10) Application does not have permission"));
    expect(await publishToInstagram("a1", deps)).toEqual({ ok: false, error: "(#10) Application does not have permission" });
  });
});

describe("the Instagram caption", () => {
  it("falls back to the Facebook text, drops links, and keeps to 2200 characters", () => {
    expect(instagramCaption(null, "Read this https://example.com/post now")).toBe("Read this now");
    expect(instagramCaption("  ", "fb")).toBe("fb");
    expect(instagramCaption("x".repeat(2500), null)).toHaveLength(2200);
    expect(instagramCaption("Line one\n\nLine two", null)).toBe("Line one\n\nLine two");
  });
});
