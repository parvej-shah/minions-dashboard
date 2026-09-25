import { beforeEach, describe, expect, it, vi } from "vitest";

const assetFindFirst = vi.fn();
const assetFindMany = vi.fn();
const assetFindUnique = vi.fn();
const assetUpdateMany = vi.fn();
const clientFindUnique = vi.fn();
const blogFindFirst = vi.fn();
const syncAssetToBlog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    asset: { findFirst: assetFindFirst, findMany: assetFindMany, findUnique: assetFindUnique, updateMany: assetUpdateMany },
    client: { findUnique: clientFindUnique },
    blog: { findFirst: blogFindFirst },
  },
}));
vi.mock("@/services/publishing", () => ({ syncAssetToBlog }));

const { schedulePost, unschedulePost, releaseDuePosts } = await import("./postSchedule");

const NOW = new Date("2026-09-25T13:00:00Z"); // 09:00 in New York
const draft = { id: "a1", slug: "a-post", status: "PENDING_REVIEW", publishedAt: null, linkedinPublishedAt: null, facebookPublishedAt: null };

beforeEach(() => {
  vi.clearAllMocks();
  assetFindFirst.mockResolvedValue(draft);
  clientFindUnique.mockResolvedValue({ timezone: "America/New_York" });
  blogFindFirst.mockResolvedValue(null);
  assetUpdateMany.mockResolvedValue({ count: 1 });
});

describe("scheduling a reviewed post", () => {
  it("approves it for the chosen local time", async () => {
    const r = await schedulePost("c1", "a1", "2026-09-28", "09:00", NOW);
    expect(r).toEqual({ ok: true, scheduled_for: "2026-09-28T13:00:00.000Z", status: "SCHEDULED" });
    expect(assetUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SCHEDULED", claimsOk: "Y", scheduledFor: new Date("2026-09-28T13:00:00Z") }) })
    );
  });

  it("refuses a post that is already out, including one only the blog row shows", async () => {
    assetFindFirst.mockResolvedValue({ ...draft, linkedinPublishedAt: new Date() });
    expect(await schedulePost("c1", "a1", "2026-09-28", "09:00", NOW)).toMatchObject({ ok: false, status: 409 });
    assetFindFirst.mockResolvedValue(draft);
    blogFindFirst.mockResolvedValue({ slug: "a-post" });
    expect(await schedulePost("c1", "a1", "2026-09-28", "09:00", NOW)).toMatchObject({ ok: false, status: 409 });
    expect(assetUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a time in the past", async () => {
    expect(await schedulePost("c1", "a1", "2026-09-25", "08:00", NOW)).toMatchObject({ ok: false, status: 400 });
  });

  it("cancels back to review only while still scheduled", async () => {
    expect(await unschedulePost("c1", "a1", NOW)).toMatchObject({ ok: true, status: "PENDING_REVIEW" });
    assetUpdateMany.mockResolvedValue({ count: 0 });
    expect(await unschedulePost("c1", "a1", NOW)).toMatchObject({ ok: false, status: 409 });
  });
});

describe("releasing due posts", () => {
  it("publishes each due post once and puts it on the blog", async () => {
    assetFindMany.mockResolvedValue([{ id: "a1" }, { id: "a2" }]);
    assetUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }); // a2 taken by another poll
    assetFindUnique.mockResolvedValue({ id: "a1", status: "PUBLISHED" });
    expect(await releaseDuePosts(NOW)).toEqual(["a1"]);
    expect(assetFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "SCHEDULED", scheduledFor: { lte: NOW } } }));
    expect(syncAssetToBlog).toHaveBeenCalledTimes(1);
    expect(syncAssetToBlog).toHaveBeenCalledWith({ id: "a1", status: "PUBLISHED" }, "PUBLISHED", {});
  });
});
