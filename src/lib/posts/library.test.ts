import { describe, expect, it } from "vitest";
import { defaultShow, groupOf, isPostStuck, postsFor, statusLine } from "./library";

type P = { id: string; status: string; created_at: string; scheduled_for: string | null; published_at: string | null; publish_failures?: Record<string, string> | null };
const p = (id: string, status: string, extra: Partial<P> = {}): P => ({
  id,
  status,
  created_at: "2026-11-01T00:00:00Z",
  scheduled_for: null,
  published_at: null,
  ...extra,
});

describe("groupOf", () => {
  it("puts each status in one plain group", () => {
    expect(groupOf("PENDING_REVIEW")).toBe("needs");
    expect(groupOf("BLOCKED")).toBe("needs");
    expect(groupOf("SCHEDULED")).toBe("scheduled");
    expect(groupOf("APPROVED")).toBe("scheduled");
    expect(groupOf("PUBLISHED")).toBe("posted");
    expect(groupOf("FAILED")).toBe("failed");
    expect(groupOf("UNPUBLISHED")).toBe("other");
    expect(groupOf("DRAFT")).toBe("other");
    expect(groupOf(p("fail", "PUBLISHED", { publish_failures: { linkedin: "bad token" } }))).toBe("failed");
  });
});

describe("postsFor", () => {
  const posts = [
    p("n2", "PENDING_REVIEW", { created_at: "2026-11-05T00:00:00Z" }),
    p("n1", "PENDING_REVIEW", { created_at: "2026-11-02T00:00:00Z" }),
    p("s2", "SCHEDULED", { scheduled_for: "2026-11-20T03:00:00Z" }),
    p("s1", "SCHEDULED", { scheduled_for: "2026-11-11T03:00:00Z" }),
    p("old", "PUBLISHED", { published_at: "2026-10-01T00:00:00Z" }),
    p("new", "PUBLISHED", { published_at: "2026-11-06T00:00:00Z" }),
    p("down", "UNPUBLISHED"),
  ];
  it("orders each view the way you act on it", () => {
    expect(postsFor(posts, "needs").map((x) => x.id)).toEqual(["n2", "n1"]);
    expect(postsFor(posts, "scheduled").map((x) => x.id)).toEqual(["s1", "s2"]);
    expect(postsFor(posts, "posted").map((x) => x.id)).toEqual(["new", "old"]);
  });
  it("shows everything under All: waiting first, then scheduled, then the rest newest first", () => {
    expect(postsFor(posts, "all").map((x) => x.id)).toEqual(["n2", "n1", "s1", "s2", "new", "old", "down"]);
  });
  it("opens on Needs you when something waits, else All", () => {
    expect(defaultShow(posts)).toBe("needs");
    expect(defaultShow(posts.filter((x) => x.status !== "PENDING_REVIEW"))).toBe("all");
  });
});

describe("statusLine", () => {
  const tz = "Asia/Dhaka";
  it("says what is true in plain words", () => {
    expect(statusLine(p("a", "PENDING_REVIEW"), tz)).toEqual({ text: "Needs you", tone: "coral" });
    expect(statusLine(p("a", "BLOCKED"), tz)).toEqual({ text: "Needs a fix", tone: "coral" });
    expect(statusLine(p("a", "SCHEDULED", { scheduled_for: "2026-11-11T03:00:00Z" }), tz)).toEqual({ text: "Scheduled · Wed 11 Nov, 09:00", tone: "success" });
    expect(statusLine(p("a", "PUBLISHED", { published_at: "2026-11-06T03:00:00Z" }), tz)).toEqual({ text: "Posted · Fri 6 Nov", tone: "muted" });
    expect(statusLine(p("a", "PUBLISHED", { published_at: "2026-11-06T03:00:00Z", publish_failures: { linkedin: "expired" } }), tz)).toEqual({ text: "Partly posted · LinkedIn failed", tone: "coral" });
    expect(statusLine(p("a", "UNPUBLISHED"), tz)).toEqual({ text: "Taken down", tone: "muted" });
    expect(statusLine(p("a", "DRAFT"), tz)).toEqual({ text: "Being written", tone: "brand" });
  });
});

describe("a released post that never went out (task 127)", () => {
  const tz = "Asia/Dhaka";
  const released = "2026-11-24T15:00:00Z";
  const minutesAfter = (m: number) => new Date(new Date(released).getTime() + m * 60_000);
  const post = p("s", "PUBLISHED", { scheduled_for: released });

  it("is stuck 20 minutes after its release, with no posting time and no failure", () => {
    expect(isPostStuck(post, minutesAfter(20))).toBe(true);
    expect(groupOf(post, minutesAfter(20))).toBe("failed");
    expect(statusLine(post, tz, minutesAfter(20))).toEqual({ text: "Not posted · it did not reach your channels", tone: "coral" });
  });

  it("reads Going out in the first 15 minutes", () => {
    expect(isPostStuck(post, minutesAfter(5))).toBe(false);
    expect(groupOf(post, minutesAfter(5))).toBe("posted");
    expect(statusLine(post, tz, minutesAfter(5))).toEqual({ text: "Going out", tone: "brand" });
  });

  it("is not stuck once it has a posting time", () => {
    const sent = p("s", "PUBLISHED", { scheduled_for: released, published_at: "2026-11-24T15:03:00Z" });
    expect(isPostStuck(sent, minutesAfter(60))).toBe(false);
    expect(statusLine(sent, tz, minutesAfter(60)).text).toBe("Posted · Tue 24 Nov");
  });

  it("is not stuck when it was never scheduled (older or hand-marked posts)", () => {
    expect(isPostStuck(p("s", "PUBLISHED"), minutesAfter(60))).toBe(false);
  });
});
