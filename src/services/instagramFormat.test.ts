import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const assetUpdate = vi.fn();
const channelFind = vi.fn();
const channelUpsert = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { asset: { findFirst, update: assetUpdate }, clientChannel: { findUnique: channelFind, upsert: channelUpsert } },
}));

const { setInstagramFormat } = await import("./instagramFormat");

const spec = { active: false, pdf_url: "https://r2/c/c.pdf", pages: ["https://r2/c/01.jpg", "https://r2/c/02.jpg"] };

beforeEach(() => {
  vi.clearAllMocks();
  findFirst.mockResolvedValue({ id: "a1", carouselSpec: spec, instagramPostId: null });
  channelFind.mockResolvedValue({ config: { other: 1 } });
});

describe("choosing the Instagram format", () => {
  it("saves it on the draft and as the workspace's default", async () => {
    expect(await setInstagramFormat("c1", "a1", "SINGLE")).toEqual({ ok: true, format: "SINGLE" });
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "a1", clientId: "c1" } }));
    expect(assetUpdate).toHaveBeenCalledWith({ where: { id: "a1" }, data: { carouselSpec: { ...spec, instagram_format: "SINGLE" } } });
    expect(channelUpsert).toHaveBeenCalledWith({
      where: { clientId_channelKey: { clientId: "c1", channelKey: "instagram" } },
      update: { config: { other: 1, format: "SINGLE" } },
      create: { clientId: "c1", channelKey: "instagram", isActive: false, config: { format: "SINGLE" } },
    });
  });

  it("refuses once the post is on Instagram", async () => {
    findFirst.mockResolvedValue({ id: "a1", carouselSpec: spec, instagramPostId: "ig-9" });
    expect(await setInstagramFormat("c1", "a1", "SINGLE")).toMatchObject({ ok: false });
    expect(assetUpdate).not.toHaveBeenCalled();
    expect(channelUpsert).not.toHaveBeenCalled();
  });

  it("refuses when the draft has no carousel to post", async () => {
    findFirst.mockResolvedValue({ id: "a1", carouselSpec: null, instagramPostId: null });
    expect(await setInstagramFormat("c1", "a1", "CAROUSEL")).toMatchObject({ ok: false });
    expect(assetUpdate).not.toHaveBeenCalled();
  });
});
