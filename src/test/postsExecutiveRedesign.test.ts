import { describe, expect, it } from "vitest";
import { postsFor, splitCuratedAndReserve, sortReservePosts } from "@/lib/posts/library";

type MockPost = {
  id: string;
  title: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  hook?: string;
  channels?: string[];
};

const makePost = (p: Partial<MockPost> & { id: string }): MockPost => ({
  title: `Title ${p.id}`,
  status: "PENDING_REVIEW",
  scheduled_for: null,
  published_at: null,
  created_at: "2026-11-01T00:00:00Z",
  hook: `Opening hook for ${p.id}`,
  channels: ["LINKEDIN"],
  ...p,
});

describe("Posts Library Executive Redesign (Task 67)", () => {
  it("postsFor('needs') sorts newest drafts first so fresh content leads", () => {
    const posts = [
      makePost({ id: "p1", created_at: "2026-11-01T00:00:00Z" }),
      makePost({ id: "p3", created_at: "2026-11-12T00:00:00Z" }),
      makePost({ id: "p2", created_at: "2026-11-05T00:00:00Z" }),
    ];

    const result = postsFor(posts, "needs");
    expect(result.map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
  });

  it("splitCuratedAndReserve separates the top 3 unapproved drafts from the reserve", () => {
    const posts = Array.from({ length: 8 }, (_, i) =>
      makePost({ id: `post-${i + 1}`, created_at: `2026-11-0${i + 1}T00:00:00Z` })
    );

    const { curated, reserve } = splitCuratedAndReserve(posts, 3);
    expect(curated).toHaveLength(3);
    expect(curated.map((p) => p.id)).toEqual(["post-1", "post-2", "post-3"]);
    expect(reserve).toHaveLength(5);
    expect(reserve.map((p) => p.id)).toEqual(["post-4", "post-5", "post-6", "post-7", "post-8"]);
  });

  it("splitCuratedAndReserve handles when fewer than 3 drafts exist", () => {
    const posts = [makePost({ id: "solo" })];
    const { curated, reserve } = splitCuratedAndReserve(posts, 3);
    expect(curated).toHaveLength(1);
    expect(reserve).toHaveLength(0);
  });

  it("sortReservePosts allows switching between newest and oldest sort order", () => {
    const reserve = [
      makePost({ id: "mid", created_at: "2026-11-05T00:00:00Z" }),
      makePost({ id: "old", created_at: "2026-11-01T00:00:00Z" }),
      makePost({ id: "new", created_at: "2026-11-10T00:00:00Z" }),
    ];

    const newest = sortReservePosts(reserve, "newest");
    expect(newest.map((p) => p.id)).toEqual(["new", "mid", "old"]);

    const oldest = sortReservePosts(reserve, "oldest");
    expect(oldest.map((p) => p.id)).toEqual(["old", "mid", "new"]);
  });
});
