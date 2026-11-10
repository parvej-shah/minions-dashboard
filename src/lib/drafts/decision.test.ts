import { describe, expect, it } from "vitest";
import { postButtonLabel, shortWhen, whereText } from "./decision";

const ALL = { blog: true, linkedin: true, facebook: false, instagram: false, x: false };

describe("whereText", () => {
  it("names where the post goes, in plain words", () => {
    expect(whereText([], ALL)).toBe("LinkedIn and your blog");
    expect(whereText(["linkedin"], ALL)).toBe("LinkedIn");
    expect(whereText([], { ...ALL, facebook: true })).toBe("LinkedIn, Facebook and your blog");
    expect(whereText([], { blog: false, linkedin: false, facebook: false, instagram: false, x: false })).toBe("Nowhere yet: switch on a channel");
  });
  it("waits for the workspace switches", () => {
    expect(whereText([], null)).toBeNull();
  });
});

describe("postButtonLabel", () => {
  const tz = "Asia/Dhaka";
  const now = new Date("2026-11-09T02:30:00Z"); // Mon 08:30 Dhaka
  it("says the weekday and time inside the coming week", () => {
    expect(postButtonLabel("2026-11-11T03:00:00Z", tz, now)).toBe("Post on Wed 09:00");
  });
  it("says today for a slot later today", () => {
    expect(postButtonLabel("2026-11-09T15:00:00Z", tz, now)).toBe("Post today at 21:00");
  });
  it("adds the date beyond a week", () => {
    expect(postButtonLabel("2026-11-20T03:00:00Z", tz, now)).toBe("Post on Fri 20 Nov, 09:00");
  });
});

describe("shortWhen", () => {
  it("is the same time in fewer words", () => {
    const now = new Date("2026-11-09T02:30:00Z");
    expect(shortWhen("2026-11-09T15:00:00Z", "Asia/Dhaka", now)).toBe("today 21:00");
    expect(shortWhen("2026-11-11T03:00:00Z", "Asia/Dhaka", now)).toBe("Wed 09:00");
  });
});
