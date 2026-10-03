import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { followUpNotReady, linkedinWentAs } from "@/lib/followUp";

const db = {
  asset: { findFirst: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn() },
  brandDirective: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/tenantDomain", () => ({ getTenantBlogDomain: vi.fn(async () => "example.com") }));

const { createFollowUp } = await import("./followUp");

const carousel = { active: false, pdf_url: "https://cdn/carousels/c1/a1-1/carousel.pdf", caption: "Carousel caption never posted", plan: { caption: "Carousel caption never posted" }, document_title: "Doc" };
const original = {
  id: "a1", clientId: "c1", ideaId: "IDEA-1", slug: "why-demos-fail", title: "Why demos fail", hook: "Demos lie.", coreArgument: "Test live.",
  content: "![Why demos fail](https://cdn/covers/c1/a1-1.png)\n\nDemos run in quiet rooms. Buyers call from cars.", audience: "ICP", pillar: "", targetTrade: "",
  claimsOk: "Y", coverSpec: { layout: "STATEMENT", headline: "Test on live calls" }, heroImageUrl: "https://cdn/covers/c1/a1-1.png", heroStatus: "READY", heroProvider: "code",
  carouselSpec: carousel, linkedinVariant: "The LinkedIn post that went out", facebookVariant: "fb", xVariant: "x",
  linkedinPublishedAt: new Date("2026-10-01"), followUpOf: null, status: "PUBLISHED",
};
const row = { id: "new", title: "Why demos fail", slug: "why-demos-fail-carousel", hook: "", coreArgument: "", content: "", audience: "ICP", pillar: "", targetTrade: "", status: "PENDING_REVIEW", claimsOk: "Y", reviewNotes: [], coverSpec: null, heroImageUrl: null, heroStatus: "READY", heroErrorCode: null, heroProvider: null, heroAttempts: 0, docUrl: null, linkedinVariant: "", facebookVariant: "", xVariant: "", version: 1, generationCost: 0, channels: ["linkedin"], scheduledFor: null, publishedAt: null, publishedUrls: null, createdAt: new Date(), updatedAt: new Date(), linkedinPublishedAt: null, carouselSpec: null, followUpOf: "a1", followUpFormat: "CAROUSEL", claims: [] };

const created = () => db.asset.create.mock.calls[0][0].data;

beforeEach(() => {
  vi.clearAllMocks();
  db.asset.findFirst.mockResolvedValue(original);
  db.asset.findUnique.mockResolvedValue(null);
  db.asset.create.mockResolvedValue({ id: "new" });
  db.asset.findUniqueOrThrow.mockResolvedValue(row);
  db.brandDirective.findMany.mockResolvedValue([]);
});

describe("a second LinkedIn post", () => {
  it("after a cover post, shares the carousel with a new caption, on LinkedIn only", async () => {
    const write = vi.fn().mockResolvedValue("A new caption");
    const result = await createFollowUp("c1", "a1", { write });
    expect(result.created).toBe(true);
    expect(write.mock.calls[0][0]).toMatchObject({ posted: "The LinkedIn post that went out", format: "CAROUSEL" });
    const data = created();
    expect(data).toMatchObject({ followUpOf: "a1", followUpFormat: "CAROUSEL", channels: ["linkedin"], status: "PENDING_REVIEW", slug: "why-demos-fail-carousel" });
    expect(data.ideaId).toBeUndefined();
    expect(data.carouselSpec).toMatchObject({ active: true, caption: "A new caption", plan: { caption: "A new caption" }, pdf_url: carousel.pdf_url });
  });

  it("after a carousel post, shares the cover with new text and no carousel", async () => {
    db.asset.findFirst.mockResolvedValue({ ...original, carouselSpec: { ...carousel, active: true } });
    const write = vi.fn().mockResolvedValue("A new post beside the cover");
    await createFollowUp("c1", "a1", { write });
    expect(write.mock.calls[0][0]).toMatchObject({ posted: "Carousel caption never posted", format: "COVER" });
    expect(created()).toMatchObject({ followUpFormat: "COVER", linkedinVariant: "A new post beside the cover", carouselSpec: Prisma.DbNull, heroImageUrl: original.heroImageUrl });
  });

  it("falls back to text LinkedIn has not shown, never the posted text", async () => {
    await createFollowUp("c1", "a1", { write: vi.fn().mockResolvedValue(null) });
    expect(created().carouselSpec.caption).toBe("Carousel caption never posted");
  });

  it("with no carousel yet, writes nothing: the reviewer makes one on the new draft", async () => {
    db.asset.findFirst.mockResolvedValue({ ...original, carouselSpec: null });
    const write = vi.fn();
    await createFollowUp("c1", "a1", { write });
    expect(write).not.toHaveBeenCalled();
    expect(created()).toMatchObject({ followUpFormat: "CAROUSEL", carouselSpec: Prisma.DbNull });
  });

  it("opens the second post already drafted instead of making another", async () => {
    db.asset.findUnique.mockResolvedValue({ id: "new" });
    const result = await createFollowUp("c1", "a1", { write: vi.fn() });
    expect(result.created).toBe(false);
    expect(db.asset.create).not.toHaveBeenCalled();
  });

  it("refuses a draft not yet on LinkedIn, and a second post of a second post", async () => {
    db.asset.findFirst.mockResolvedValue({ ...original, linkedinPublishedAt: null });
    await expect(createFollowUp("c1", "a1", { write: vi.fn() })).rejects.toThrow(/not gone out on LinkedIn/);
    db.asset.findFirst.mockResolvedValue({ ...original, followUpOf: "a0" });
    await expect(createFollowUp("c1", "a1", { write: vi.fn() })).rejects.toThrow(/already a second post/);
  });
});

describe("follow-up rules", () => {
  it("knows what LinkedIn got", () => {
    expect(linkedinWentAs({ linkedinPublishedAt: null, carouselSpec: carousel })).toBeNull();
    expect(linkedinWentAs({ linkedinPublishedAt: new Date(), carouselSpec: carousel })).toBe("COVER");
    expect(linkedinWentAs({ linkedinPublishedAt: new Date(), carouselSpec: { ...carousel, active: true } })).toBe("CAROUSEL");
  });

  it("holds a carousel post until its carousel is on", () => {
    expect(followUpNotReady({ followUpFormat: "CAROUSEL", carouselSpec: null })).toMatch(/Make the carousel/);
    expect(followUpNotReady({ followUpFormat: "CAROUSEL", carouselSpec: { ...carousel, active: true } })).toBeNull();
    expect(followUpNotReady({ followUpFormat: "COVER", carouselSpec: null })).toBeNull();
    expect(followUpNotReady({ followUpFormat: null, carouselSpec: null })).toBeNull();
  });
});
