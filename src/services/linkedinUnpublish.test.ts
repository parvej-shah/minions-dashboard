import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindFirst = vi.fn();
const assetUpdateMany = vi.fn();
const assetFindUniqueOrThrow = vi.fn();
const channelFindUnique = vi.fn();
const readChannelToken = vi.fn();
const removeFromBlog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    asset: { findFirst: assetFindFirst, updateMany: assetUpdateMany, findUniqueOrThrow: assetFindUniqueOrThrow },
    clientChannel: { findUnique: channelFindUnique },
  },
}));
vi.mock("@/services/channels", () => ({ readChannelToken }));
vi.mock("@/services/publishing", () => ({ removeFromBlog }));
vi.mock("@/services/assets", () => ({ ownedAssetWhere: (clientId: string, id: string) => ({ clientId, id }) }));
vi.mock("@/lib/tenantDomain", () => ({ getTenantBlogDomain: async () => null }));
vi.mock("@/lib/mappers/asset", () => ({ toAssetDTO: (a: { id: string; status: string }) => ({ id: a.id, status: a.status }) }));

const { unpublishFromLinkedIn } = await import("./linkedinUnpublish");

const URN = "urn:li:share:7300000000000000001";
const NOW = new Date("2026-11-09T10:00:00Z");
const published = { id: "a1", slug: "a-post", clientId: "c1", status: "PUBLISHED", linkedinPostId: URN, facebookPostId: null };

const deletePost = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  assetFindFirst.mockResolvedValue(published);
  channelFindUnique.mockResolvedValue({ credentialRef: "vault-1" });
  readChannelToken.mockResolvedValue("tok");
  deletePost.mockResolvedValue({ ok: true });
  assetUpdateMany.mockResolvedValue({ count: 1 });
  assetFindUniqueOrThrow.mockResolvedValue({ ...published, status: "PENDING_REVIEW" });
  removeFromBlog.mockResolvedValue(undefined);
});

describe("unpublishing a post from LinkedIn", () => {
  it("deletes the LinkedIn post, takes it off the blog and returns the draft to review", async () => {
    const r = await unpublishFromLinkedIn("c1", "a1", { deletePost, now: NOW });
    expect(r).toMatchObject({ ok: true, asset: { id: "a1", status: "PENDING_REVIEW" } });
    expect(deletePost).toHaveBeenCalledWith("tok", URN);
    expect(removeFromBlog).toHaveBeenCalledWith("a1", "a-post", "c1");
    const { where, data } = assetUpdateMany.mock.calls[0][0];
    expect(where).toMatchObject({ id: "a1", status: "PUBLISHED" });
    expect(data).toMatchObject({
      status: "PENDING_REVIEW",
      publishedAt: null,
      publishedUrls: null,
      linkedinPostId: null,
      linkedinPublishedAt: null,
    });
  });

  it("treats a post LinkedIn no longer has as already deleted", async () => {
    deletePost.mockResolvedValue({ ok: true, alreadyGone: true });
    expect(await unpublishFromLinkedIn("c1", "a1", { deletePost, now: NOW })).toMatchObject({ ok: true });
    expect(assetUpdateMany).toHaveBeenCalled();
  });

  it.each([
    [401, 409, /reconnect/i],
    [403, 409, /refused/i],
    [500, 502, /LinkedIn/],
  ])("leaves everything as it was when LinkedIn answers %i", async (status, expected, message) => {
    deletePost.mockResolvedValue({ ok: false, status });
    const r = await unpublishFromLinkedIn("c1", "a1", { deletePost, now: NOW });
    expect(r).toMatchObject({ ok: false, status: expected });
    if (!r.ok) expect(r.error).toMatch(message);
    expect(assetUpdateMany).not.toHaveBeenCalled();
    expect(removeFromBlog).not.toHaveBeenCalled();
  });

  it("refuses a post it cannot find", async () => {
    assetFindFirst.mockResolvedValue(null);
    expect(await unpublishFromLinkedIn("c1", "a1", { deletePost })).toMatchObject({ ok: false, status: 404 });
  });

  it.each([
    ["not published", { status: "PENDING_REVIEW" }],
    ["posted by hand (no LinkedIn id)", { linkedinPostId: null }],
    ["also on Facebook", { facebookPostId: "fb-1" }],
  ])("refuses a post that is %s, without calling LinkedIn", async (_label, change) => {
    assetFindFirst.mockResolvedValue({ ...published, ...change });
    expect(await unpublishFromLinkedIn("c1", "a1", { deletePost })).toMatchObject({ ok: false, status: 409 });
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("asks to reconnect when the workspace has no LinkedIn token", async () => {
    channelFindUnique.mockResolvedValue({ credentialRef: null });
    const r = await unpublishFromLinkedIn("c1", "a1", { deletePost });
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(deletePost).not.toHaveBeenCalled();
  });
});
