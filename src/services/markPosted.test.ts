import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindFirst = vi.fn();
const assetUpdateMany = vi.fn();
const blogFindFirst = vi.fn();
const refreshCoverIfStale = vi.fn();
const syncAssetToBlog = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { asset: { findFirst: assetFindFirst, updateMany: assetUpdateMany }, blog: { findFirst: blogFindFirst } } }));
vi.mock("@/services/cover", () => ({ refreshCoverIfStale }));
vi.mock("@/services/publishing", () => ({ syncAssetToBlog }));

const { markPosted } = await import("./markPosted");

const NOW = new Date("2026-11-10T09:00:00Z");
const draft = { id: "a1", slug: "a-post", status: "PENDING_REVIEW", publishedAt: null, linkedinPublishedAt: null, facebookPublishedAt: null };

beforeEach(() => {
  vi.clearAllMocks();
  assetFindFirst.mockResolvedValue(draft);
  blogFindFirst.mockResolvedValue(null);
  assetUpdateMany.mockResolvedValue({ count: 1 });
});

describe("marking a post as posted by hand", () => {
  it("records it as out on LinkedIn with a publish time, so the publisher's poll skips it", async () => {
    const r = await markPosted("c1", "a1", NOW);
    expect(r).toMatchObject({ ok: true, published_at: NOW.toISOString(), linkedin_went_as: "COVER" });
    const data = assetUpdateMany.mock.calls[0][0].data;
    expect(data).toMatchObject({ status: "PUBLISHED", publishedAt: NOW, linkedinPublishedAt: NOW });
    expect(data.publishedAt).not.toBeNull();
  });

  it("never touches the blog or the publisher", async () => {
    await markPosted("c1", "a1", NOW);
    expect(syncAssetToBlog).not.toHaveBeenCalled();
  });

  it("brings the cover in line with the text first, like approving does", async () => {
    await markPosted("c1", "a1", NOW);
    expect(refreshCoverIfStale).toHaveBeenCalledWith("a1");
  });

  it("refuses a post that is already out, and one that is not found", async () => {
    assetFindFirst.mockResolvedValue({ ...draft, status: "PUBLISHED" });
    expect(await markPosted("c1", "a1", NOW)).toMatchObject({ ok: false, status: 409 });
    assetFindFirst.mockResolvedValue(null);
    expect(await markPosted("c1", "a1", NOW)).toMatchObject({ ok: false, status: 404 });
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a scheduled post: cancel the schedule first", async () => {
    assetFindFirst.mockResolvedValue({ ...draft, status: "SCHEDULED" });
    expect(await markPosted("c1", "a1", NOW)).toMatchObject({ ok: false, status: 409 });
  });
});
