import { describe, expect, it } from "vitest";
import { defaultShow, groupOf, postsFor, statusLine } from "./library";

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
    expect(groupOf("UNPUBLISHED")).toBe("other");
    expect(groupOf("DRAFT")).toBe("other");
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
    expect(postsFor(posts, "needs").map((x) => x.id)).toEqual(["n1", "n2"]);
    expect(postsFor(posts, "scheduled").map((x) => x.id)).toEqual(["s1", "s2"]);
    expect(postsFor(posts, "posted").map((x) => x.id)).toEqual(["new", "old"]);
  });
  it("shows everything under All: waiting first, then scheduled, then the rest newest first", () => {
    expect(postsFor(posts, "all").map((x) => x.id)).toEqual(["n1", "n2", "s1", "s2", "new", "old", "down"]);
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
