import { beforeEach, describe, expect, it, vi } from "vitest";

const brandFind = vi.fn();
const blogFindFirst = vi.fn();
const blogFindUnique = vi.fn();
const blogUpsert = vi.fn();
const blogDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    brandProfile: { findUnique: brandFind },
    blog: { findFirst: blogFindFirst, findUnique: blogFindUnique, upsert: blogUpsert, deleteMany: blogDeleteMany, update: vi.fn() },
  },
}));

const { buildAuthor, upsertToBlog, removeFromBlog, TENANT_ZERO_ID } = await import("./publishing");

const asset = (clientId: string) =>
  ({ id: "ASSET-1", clientId, slug: "a-post", title: "A post", hook: "", coreArgument: "", content: "x", audience: "ICP", pillar: "", docUrl: null, publishedAt: null }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  blogFindFirst.mockResolvedValue(null);
});

describe("blog byline", () => {
  it("only getminions.ai's own posts are signed by a Minions founder", async () => {
    expect((await buildAuthor(TENANT_ZERO_ID)).role).toBe("Co-Founder, Minions.AI");
  });

  it("another workspace's post is credited to that brand", async () => {
    brandFind.mockResolvedValue({ brandName: "Keystone Lead Ops", primaryLogoUrl: "https://cdn.example/k.svg" });
    const author = await buildAuthor("c-other");
    expect(author).toEqual({ name: "Keystone Lead Ops Team", role: "Editorial Team", avatar: "https://cdn.example/k.svg" });
    expect(JSON.stringify(author)).not.toMatch(/Minions|Parvej|Rakib/);
  });
});

describe("blogs rows are never touched across workspaces", () => {
  it("refuses to upsert over a slug owned by another workspace", async () => {
    blogFindUnique.mockResolvedValue({ clientId: TENANT_ZERO_ID });
    await expect(upsertToBlog(asset("c-other"))).rejects.toThrow(/another workspace/);
    expect(blogUpsert).not.toHaveBeenCalled();
  });

  it("creates the row with the asset's own workspace", async () => {
    blogFindUnique.mockResolvedValue(null);
    brandFind.mockResolvedValue({ brandName: "Acme", primaryLogoUrl: "" });
    await upsertToBlog(asset("c-other"));
    expect(blogUpsert.mock.calls[0][0].create.clientId).toBe("c-other");
  });

  it("deletes only within the asset's workspace", async () => {
    await removeFromBlog("ASSET-1", "a-post", "c-other");
    expect(blogDeleteMany.mock.calls[0][0].where.clientId).toBe("c-other");
  });
});
