import { describe, expect, it } from "vitest";
import { buildWeek, greeting, recentlyPosted, waitingForYou } from "./today";

const TZ = "Asia/Dhaka"; // UTC+6, no DST
// Monday 9 Nov 2026, 08:30 in Dhaka
const NOW = new Date("2026-11-09T02:30:00Z");

type A = { id: string; title: string; status: string; scheduled_for: string | null; published_at: string | null; created_at: string };
const a = (p: Partial<A> & { id: string }): A => ({
  title: p.id,
  status: "PENDING_REVIEW",
  scheduled_for: null,
  published_at: null,
  created_at: "2026-11-01T00:00:00Z",
  ...p,
});

describe("greeting", () => {
  it("follows the workspace clock", () => {
    expect(greeting(NOW, TZ)).toBe("Good morning");
    expect(greeting(new Date("2026-11-09T08:00:00Z"), TZ)).toBe("Good afternoon"); // 14:00
    expect(greeting(new Date("2026-11-09T13:00:00Z"), TZ)).toBe("Good evening"); // 19:00
  });
});

describe("buildWeek", () => {
  it("lays out seven days from today with scheduled posts and open slots", () => {
    const assets = [
      a({ id: "s1", status: "SCHEDULED", scheduled_for: "2026-11-11T03:00:00Z", title: "Wed post" }), // Wed 09:00
    ];
    const slots = ["2026-11-11T03:00:00Z", "2026-11-13T03:00:00Z", "2026-11-20T03:00:00Z"];
    const week = buildWeek(NOW, TZ, assets, slots);
    expect(week).toHaveLength(7);
    expect(week[0]).toMatchObject({ weekday: "Mon", day: 9, isToday: true, items: [] });
    // The slot Wednesday is taken by the scheduled post, so it shows once, as that post.
    expect(week[2].items).toEqual([{ kind: "scheduled", time: "09:00", title: "Wed post", id: "s1" }]);
    expect(week[4].items).toEqual([{ kind: "slot", time: "09:00" }]);
    // Beyond the week is left out.
    expect(week.flatMap((d) => d.items)).toHaveLength(2);
  });

  it("shows a post that went out today", () => {
    const assets = [a({ id: "p", status: "PUBLISHED", published_at: "2026-11-09T02:00:00Z" })];
    expect(buildWeek(NOW, TZ, assets, [])[0].items).toEqual([{ kind: "posted", time: "08:00", title: "p", id: "p" }]);
  });
});

describe("waitingForYou / recentlyPosted", () => {
  it("lists drafts waiting for review, oldest first", () => {
    const list = waitingForYou([
      a({ id: "new", created_at: "2026-11-08T00:00:00Z" }),
      a({ id: "old", created_at: "2026-11-02T00:00:00Z" }),
      a({ id: "done", status: "PUBLISHED" }),
    ]);
    expect(list.map((x) => x.id)).toEqual(["old", "new"]);
  });

  it("lists the latest published posts first", () => {
    const list = recentlyPosted(
      [
        a({ id: "a", status: "PUBLISHED", published_at: "2026-11-01T00:00:00Z" }),
        a({ id: "b", status: "PUBLISHED", published_at: "2026-11-06T00:00:00Z" }),
        a({ id: "c" }),
      ],
      5
    );
    expect(list.map((x) => x.id)).toEqual(["b", "a"]);
  });
});
