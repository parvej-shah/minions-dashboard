import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  asset: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  brandProfile: { findUnique: vi.fn() },
  icpProfile: { findUnique: vi.fn() },
  idea: { findFirst: vi.fn() },
  claim: { findMany: vi.fn() },
  blog: { findFirst: vi.fn() },
  professionalMemory: { findMany: vi.fn() },
  brandDirective: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: db }));
const uploads: string[] = [];
vi.mock("@/lib/r2", () => ({
  uploadToR2: vi.fn(async (key: string) => (uploads.push(key), { url: `https://cdn/${key}`, key })),
  deleteFromR2: vi.fn(async () => undefined),
  r2KeyFromUrl: (url: string | null) => url?.replace("https://cdn/", "") ?? null,
}));

const { generateCarousel, editCarousel, setCarouselActive, CAROUSEL_LOCKED } = await import("./carousel");
const { deleteFromR2 } = await import("@/lib/r2");

const body = "Demos run in controlled environments. On a live call, two seconds of silence and the buyer hangs up. Test latency on live calls before you buy.";
const asset = {
  id: "a1", clientId: "c1", ideaId: null, slug: "s", title: "Why demos fail", hook: "Demos lie.", coreArgument: "Test live.", content: body,
  coverSpec: null, carouselSpec: null, status: "PENDING_REVIEW", publishedAt: null, linkedinPublishedAt: null, facebookPublishedAt: null,
};
const plan = {
  structure: "CHECKLIST",
  label: "Voice AI demos",
  cover: { headline: "Test your voice agent on live calls, not demos", emphasis: "live" },
  slides: [
    { layout: "STAKES", statement: "A demo runs in a quiet room. Your buyers call from the car." },
    { layout: "POINT", title: "Demos hide the delays live calls expose" },
    { layout: "POINT", title: "Silence on a live call reads as a dropped line" },
    { layout: "CHECKLIST", title: "Before you buy", items: ["Call it from a real phone", "Time the first reply", "Book a real showing"] },
    { layout: "CLOSE", takeaway: "Judge the agent on live calls, not demos.", save_line: "Save this for your next vendor demo." },
  ],
  caption: "Your voice AI demo went perfectly. Your first live call did not.\n\nDemos run in controlled rooms. Buyers call from cars, with noise and little patience.\n\nHere is what to test before you trust one with your leads.",
  document_title: "Test voice AI on live calls",
};
const reply = (p: unknown) => ({ status: 200, model: "qwen3.8-max", body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(p) } }] }) });

beforeEach(() => {
  vi.clearAllMocks();
  uploads.length = 0;
  db.asset.findUnique.mockResolvedValue(asset);
  db.brandProfile.findUnique.mockResolvedValue({ brandName: "Parvej Shah", primaryInk: "#12242a", brandCream: "#fff8f0", brandCoral: "#ff6b4a", brandTeal: "#0e5c63", coverByline: "Founder", positioning: "", primaryLogoUrl: "" });
  db.icpProfile.findUnique.mockResolvedValue(null);
  db.claim.findMany.mockResolvedValue([{ claimText: "On a live call, two seconds of silence and the buyer hangs up" }]);
  db.blog.findFirst.mockResolvedValue(null);
  db.professionalMemory.findMany.mockResolvedValue([]);
  db.brandDirective.findMany.mockResolvedValue([]);
});

describe("making a carousel", () => {
  it("draws a passing plan, uploads only the PDF, and switches it on", async () => {
    const chat = vi.fn().mockResolvedValue(reply(plan));
    const result = await generateCarousel("a1", { chat });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(chat).toHaveBeenCalledTimes(1);
    expect(result.carousel.active).toBe(true);
    expect(result.carousel.pages).toBeUndefined();
    expect(result.carousel.pdf_url).toMatch(/carousel\.pdf$/);
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatch(/^carousels\/c1\/a1-\d+\/carousel\.pdf$/);
    expect(db.asset.update).toHaveBeenCalledTimes(1);
  }, 60_000);

  it("retries with the failures, then gives up without storing anything or showing the reviewer the checks", async () => {
    const bad = { ...plan, caption: plan.caption + " Systems must answer within two seconds." };
    const chat = vi.fn().mockResolvedValue(reply(bad));
    const result = await generateCarousel("a1", { chat });
    expect(result).toMatchObject({ ok: false, errors: [] });
    expect(chat).toHaveBeenCalledTimes(3);
    const retry = chat.mock.calls[1][0] as { messages: { content: string }[] };
    expect(retry.messages[1].content).toContain("unverified claim");
    expect(db.asset.update).not.toHaveBeenCalled();
    expect(uploads).toEqual([]);
  });

  it("recovers when the retry fixes the plan", async () => {
    const chat = vi.fn().mockResolvedValueOnce(reply({ ...plan, slides: plan.slides.slice(0, 2) })).mockResolvedValueOnce(reply(plan));
    expect((await generateCarousel("a1", { chat })).ok).toBe(true);
    expect(chat).toHaveBeenCalledTimes(2);
  }, 60_000);

  it("never changes a published draft's carousel", async () => {
    db.asset.findUnique.mockResolvedValue({ ...asset, status: "PUBLISHED" });
    const chat = vi.fn();
    const result = await generateCarousel("a1", { chat });
    expect(result).toMatchObject({ ok: false, error: CAROUSEL_LOCKED, locked: true });
    expect(chat).not.toHaveBeenCalled();
    db.asset.findUnique.mockResolvedValue({ ...asset, carouselSpec: { active: true }, publishedAt: new Date() });
    expect(await setCarouselActive("a1", false)).toMatchObject({ ok: false, locked: true });
  });
});

describe("a reviewer's edit", () => {
  const stored = { active: false, plan, pages: ["https://cdn/carousels/c1/old/01.png"], pdf_url: "https://cdn/carousels/c1/old/carousel.pdf", caption: "", document_title: "", model: "m", attempts: 1, rendered_at: "" };

  it("passes the same gates, with no model call, and keeps the on/off choice", async () => {
    db.asset.findUnique.mockResolvedValue({ ...asset, carouselSpec: stored });
    const { parsePlan } = await import("@/lib/carousel/plan");
    const edited = parsePlan(JSON.stringify({ ...plan, document_title: "Live calls, not demos" })).plan!;
    const ok = await editCarousel("a1", edited);
    expect(ok.ok && ok.carousel.active).toBe(false);
    expect(ok.ok && ok.carousel.document_title).toBe("Live calls, not demos");

    const invented = parsePlan(JSON.stringify({ ...plan, caption: plan.caption + " It lifts bookings 37%." })).plan!;
    const refused = await editCarousel("a1", invented);
    expect(refused.ok).toBe(false);
    expect(!refused.ok && refused.errors.join()).toMatch(/37/);
  }, 60_000);
});

describe("a second LinkedIn post", () => {
  const own = { active: true, plan, pdf_url: "https://cdn/carousels/c1/a2-1/carousel.pdf", caption: plan.caption, document_title: "d", model: "m", attempts: 1, rendered_at: "" };
  const shared = { ...own, pdf_url: "https://cdn/carousels/c1/a1-1/carousel.pdf" };
  const second = { ...asset, id: "a2", slug: "s-carousel", followUpOf: "a1", followUpFormat: "CAROUSEL" };

  it("never deletes the carousel file it shares with the first post, only its own", async () => {
    const { parsePlan } = await import("@/lib/carousel/plan");
    const edited = parsePlan(JSON.stringify(plan)).plan!;
    db.asset.findFirst.mockResolvedValue({ ideaId: "IDEA-1", linkedinVariant: "The first post" });
    db.asset.findUnique.mockResolvedValue({ ...second, carouselSpec: shared });
    expect((await editCarousel("a2", edited)).ok).toBe(true);
    expect(deleteFromR2).not.toHaveBeenCalled();
    db.asset.findUnique.mockResolvedValue({ ...second, carouselSpec: own });
    await editCarousel("a2", edited);
    expect(deleteFromR2).toHaveBeenCalledWith("carousels/c1/a2-1/carousel.pdf");
  }, 60_000);

  it("tells the caption what the first post said, and reads the first post's idea", async () => {
    db.asset.findFirst.mockResolvedValue({ ideaId: "IDEA-1", linkedinVariant: "The first post" });
    db.asset.findUnique.mockResolvedValue({ ...second, carouselSpec: null });
    db.idea.findFirst.mockResolvedValue(null);
    const chat = vi.fn().mockResolvedValue(reply(plan));
    await generateCarousel("a2", { chat });
    expect(db.idea.findFirst.mock.calls[0][0].where.id).toBe("IDEA-1");
    const prompt = chat.mock.calls[0][0].messages.map((m: { content: string }) => m.content).join("\n");
    expect(prompt).toMatch(/EARLIER POST:\n[\s\S]*The first post/);
    expect(prompt).toMatch(/Open with a new first line/);
  }, 60_000);

  it("keeps a carousel post's carousel on, and gives a cover post none", async () => {
    db.asset.findFirst.mockResolvedValue({ ideaId: null, linkedinVariant: "" });
    db.asset.findUnique.mockResolvedValue({ ...second, carouselSpec: own });
    expect(await setCarouselActive("a2", false)).toMatchObject({ ok: false, locked: true });
    db.asset.findUnique.mockResolvedValue({ ...second, followUpFormat: "COVER", carouselSpec: null });
    const chat = vi.fn();
    expect(await generateCarousel("a2", { chat })).toMatchObject({ ok: false, locked: true });
    expect(chat).not.toHaveBeenCalled();
  });
});
