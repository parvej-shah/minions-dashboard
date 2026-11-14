import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  postChannels,
  postFormatLabel,
  postTopicSnippet,
  postThesisSnippet,
  scheduledForToday,
} from "@/lib/today";

type MockPost = {
  id: string;
  title: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  hook?: string;
  channels?: string[];
  pillar?: string;
  target_trade?: string;
  core_argument?: string;
  carousel_pages?: string[] | null;
  linkedin_went_as?: "CAROUSEL" | "COVER" | null;
  cover?: unknown;
};

const makePost = (p: Partial<MockPost> & { id: string }): MockPost => ({
  title: `Post ${p.id}`,
  status: "PENDING_REVIEW",
  scheduled_for: null,
  published_at: null,
  created_at: "2026-11-14T10:00:00Z",
  hook: `Hook for ${p.id}`,
  channels: [],
  ...p,
});

describe("Task 76: Today Post Cards Precision & ICP Helpers", () => {
  describe("postChannels", () => {
    it("returns formatted channel names from post.channels", () => {
      const post = makePost({ id: "p1", channels: ["LINKEDIN", "INSTAGRAM"] });
      const channels = postChannels(post);
      expect(channels).toEqual(["LinkedIn", "Instagram"]);
    });

    it("falls back to default workspace channels or LinkedIn if channels is empty", () => {
      const postNoChannels = makePost({ id: "p2", channels: [] });
      expect(postChannels(postNoChannels)).toEqual(["LinkedIn"]);
      expect(postChannels(postNoChannels, ["LinkedIn", "Facebook"])).toEqual(["LinkedIn", "Facebook"]);
    });

    it("normalizes mixed-case channel names correctly", () => {
      const post = makePost({ id: "p3", channels: ["linkedin", "facebook", "Instagram"] });
      expect(postChannels(post)).toEqual(["LinkedIn", "Facebook", "Instagram"]);
    });
  });

  describe("postFormatLabel", () => {
    it("identifies carousel posts with page count", () => {
      const carouselPost = makePost({
        id: "c1",
        carousel_pages: ["page1.jpg", "page2.jpg", "page3.jpg", "page4.jpg", "page5.jpg"],
      });
      expect(postFormatLabel(carouselPost)).toBe("Carousel · 5 slides");
    });

    it("identifies cover poster when cover spec exists", () => {
      const coverPost = makePost({
        id: "c2",
        cover: { headline: "Test", layout: "HEADLINE" },
      });
      expect(postFormatLabel(coverPost)).toBe("Cover poster");
    });

    it("falls back to standard post when no visual format is detected", () => {
      const standardPost = makePost({ id: "s1" });
      expect(postFormatLabel(standardPost)).toBe("Standard post");
    });
  });

  describe("postTopicSnippet & postThesisSnippet", () => {
    it("extracts pillar as the primary topic snippet", () => {
      const post = makePost({ id: "t1", pillar: "AI Voice Agents", target_trade: "Real Estate Brokers" });
      expect(postTopicSnippet(post)).toBe("AI Voice Agents");
    });

    it("falls back to target_trade if pillar is missing", () => {
      const post = makePost({ id: "t2", target_trade: "Commercial Brokerages" });
      expect(postTopicSnippet(post)).toBe("Commercial Brokerages");
    });

    it("returns null if neither topic nor target_trade exists", () => {
      const post = makePost({ id: "t3" });
      expect(postTopicSnippet(post)).toBeNull();
    });

    it("extracts core_argument as the thesis snippet", () => {
      const post = makePost({
        id: "th1",
        core_argument: "Speed to lead under 2 minutes doubles conversion rates on inbound portal inquiries.",
      });
      expect(postThesisSnippet(post)).toBe("Speed to lead under 2 minutes doubles conversion rates on inbound portal inquiries.");
    });
  });

  describe("scheduledForToday", () => {
    const tz = "Asia/Dhaka";
    // Saturday 14 Nov 2026, 12:00 in Dhaka
    const now = new Date("2026-11-14T06:00:00Z");

    it("finds a post scheduled for today in the workspace timezone", () => {
      const posts = [
        makePost({ id: "other", status: "SCHEDULED", scheduled_for: "2026-11-16T15:00:00Z" }),
        makePost({ id: "today-post", status: "SCHEDULED", scheduled_for: "2026-11-14T15:00:00Z" }), // 21:00 Dhaka
      ];

      const found = scheduledForToday(posts, now, tz);
      expect(found?.id).toBe("today-post");
    });

    it("returns null when no posts are scheduled for today", () => {
      const posts = [
        makePost({ id: "other", status: "SCHEDULED", scheduled_for: "2026-11-16T15:00:00Z" }),
      ];
      expect(scheduledForToday(posts, now, tz)).toBeNull();
    });
  });

  describe("TodayView Component Contract (Task 76 & Task 77)", () => {
    const todayViewPath = path.resolve(__dirname, "../components/today/TodayView.tsx");

    it("ensures TodayView has clickable spotlight post card navigating to editorial edit mode", () => {
      const src = fs.readFileSync(todayViewPath, "utf-8");
      // Spotlight card must be interactive and navigate to edit mode
      expect(src).toMatch(/router\.push\(`\/editorial\?id=/);
      expect(src).toMatch(/cursor-pointer/);
    });

    it("ensures inner actions stop propagation to prevent accidental navigation", () => {
      const src = fs.readFileSync(todayViewPath, "utf-8");
      // Inner buttons (Approve, Swap angle) must stop propagation
      expect(src).toMatch(/stopPropagation/);
    });

    it("ensures ICP precision metadata is displayed on Today spotlight card", () => {
      const src = fs.readFileSync(todayViewPath, "utf-8");
      // Must use ICP helpers
      expect(src).toMatch(/postChannels/);
      expect(src).toMatch(/postFormatLabel/);
    });

    it("ensures poster width is generous (320px–340px) to balance layout and prevent narrow poster squeeze (Task 77)", () => {
      const src = fs.readFileSync(todayViewPath, "utf-8");
      // Poster should not be constrained to narrow 220px
      expect(src).not.toMatch(/sm:w-\[220px\]/);
      expect(src).toMatch(/320px|340px/);
    });

    it("ensures clutter elimination: removes noisy eyebrow above heading and removes redundant thesis paragraph (Task 77)", () => {
      const src = fs.readFileSync(todayViewPath, "utf-8");
      // No uppercase kicker/eyebrow above title (banned by craft floor)
      expect(src).not.toMatch(/uppercase text-brand/);
      // No redundant Thesis: paragraph duplicating hook
      expect(src).not.toMatch(/<span[^>]*>Thesis:\s*<\/span>/);
    });

    it("ensures top status/metadata row is removed from Today spotlight card for clean headline opening (Task 79)", () => {
      const src = fs.readFileSync(todayViewPath, "utf-8");
      // No 'Ready for your OK' status line on the card
      expect(src).not.toMatch(/Ready for your OK/);
      // No 'Draft X of Y' counter line at the top
      expect(src).not.toMatch(/Draft\s*\{\(\(spotlightIndex/);
    });
  });
});
