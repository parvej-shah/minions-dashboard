import { describe, expect, it } from "vitest";
import { waitingForYou, spotlightPost, todayHeadline, todaySchedulePayload } from "@/lib/today";

const TZ = "Asia/Dhaka"; // UTC+6

type MockPost = {
  id: string;
  title: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  hook?: string;
};

const makePost = (p: Partial<MockPost> & { id: string }): MockPost => ({
  title: `Title of ${p.id}`,
  status: "PENDING_REVIEW",
  scheduled_for: null,
  published_at: null,
  created_at: "2026-11-01T00:00:00Z",
  hook: `Hook for ${p.id}`,
  ...p,
});

describe("Today Tab: Executive Single Spotlight (Task 66)", () => {
  it("waitingForYou sorts drafts newest first so the freshest generation comes first", () => {
    const posts = [
      makePost({ id: "older", created_at: "2026-11-01T10:00:00Z" }),
      makePost({ id: "newest", created_at: "2026-11-12T16:00:00Z" }),
      makePost({ id: "middle", created_at: "2026-11-05T12:00:00Z" }),
      makePost({ id: "posted", status: "PUBLISHED", created_at: "2026-11-12T17:00:00Z" }),
    ];

    const list = waitingForYou(posts);
    expect(list.map((p) => p.id)).toEqual(["newest", "middle", "older"]);
  });

  it("spotlightPost selects the single newest draft at index 0, or cycles on swap index", () => {
    const posts = [
      makePost({ id: "draft1", created_at: "2026-11-12T12:00:00Z" }),
      makePost({ id: "draft2", created_at: "2026-11-12T14:00:00Z" }),
    ];

    const top = spotlightPost(posts, 0);
    expect(top?.id).toBe("draft2");

    const swapped = spotlightPost(posts, 1);
    expect(swapped?.id).toBe("draft1");

    const outOfBounds = spotlightPost(posts, 5);
    expect(outOfBounds).toBeNull();
  });

  it("todayHeadline anchors to the next slot milestone instead of shouting volume count", () => {
    // With next slot
    const slot = "2026-11-12T15:00:00.000Z"; // 21:00 in Dhaka (UTC+6)
    const headlineWithSlot = todayHeadline(slot, TZ);
    expect(headlineWithSlot).toContain("ready");
    expect(headlineWithSlot).not.toMatch(/\d+\s+posts\s+are\s+ready/i); // Never "21 posts are ready"
    expect(headlineWithSlot).toContain("21:00");

    // Without slot
    const headlineNoSlot = todayHeadline(null, TZ);
    expect(headlineNoSlot).toBe("Your post is ready for your OK.");
  });

  it("todaySchedulePayload extracts date and time for 1-tap inline scheduling", () => {
    const slot = "2026-11-12T15:00:00.000Z"; // 21:00 in Dhaka (UTC+6)
    const payload = todaySchedulePayload(slot, TZ);
    expect(payload).toEqual({ date: "2026-11-12", time: "21:00" });
  });
});
