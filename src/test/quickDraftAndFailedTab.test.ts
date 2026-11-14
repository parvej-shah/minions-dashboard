import { describe, expect, it } from "vitest";
import { groupOf, postsFor, statusLine, isPostFailed, type PostShow } from "@/lib/posts/library";
import fs from "node:fs";
import path from "node:path";

describe("Failed posts classification and tab logic", () => {
  const p = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
    id,
    status,
    created_at: "2026-11-01T00:00:00Z",
    scheduled_for: null,
    published_at: null,
    publish_failures: null,
    ...extra,
  });

  it("identifies failed posts correctly via isPostFailed", () => {
    expect(isPostFailed(p("1", "PUBLISHED"))).toBe(false);
    expect(isPostFailed(p("2", "PUBLISHED", { publish_failures: {} }))).toBe(false);
    expect(isPostFailed(p("3", "PUBLISHED", { publish_failures: { linkedin: "Token expired" } }))).toBe(true);
    expect(isPostFailed(p("4", "FAILED"))).toBe(true);
  });

  it("groups posts into 'failed' instead of letting them hide in 'posted'", () => {
    const successPost = p("ok", "PUBLISHED", { published_at: "2026-11-10T12:00:00Z" });
    const failedPost = p("err", "PUBLISHED", {
      published_at: "2026-11-10T12:00:00Z",
      publish_failures: { linkedin: "User revoked permissions" },
    });
    const needsPost = p("need", "PENDING_REVIEW");
    const scheduledPost = p("sched", "SCHEDULED", { scheduled_for: "2026-11-15T12:00:00Z" });

    expect(groupOf(successPost)).toBe("posted");
    expect(groupOf(failedPost)).toBe("failed");
    expect(groupOf(needsPost)).toBe("needs");
    expect(groupOf(scheduledPost)).toBe("scheduled");

    const posts = [needsPost, scheduledPost, failedPost, successPost];

    // Filter by 'posted' must NOT include failed posts
    const postedList = postsFor(posts, "posted");
    expect(postedList.map((x) => x.id)).toEqual(["ok"]);

    // Filter by 'failed' must return only failed posts
    const failedList = postsFor(posts, "failed");
    expect(failedList.map((x) => x.id)).toEqual(["err"]);

    // Filter by 'all' includes failed posts
    const allList = postsFor(posts, "all");
    expect(allList.map((x) => x.id)).toContain("err");
  });

  it("provides informative statusLine for failed posts", () => {
    const tz = "Asia/Dhaka";
    const failedPost = p("err", "PUBLISHED", {
      publish_failures: { linkedin: "Network timeout" },
    });
    const line = statusLine(failedPost, tz);
    expect(line.tone).toBe("coral");
    expect(line.text).toMatch(/LinkedIn failed/i);
  });
});

describe("Posts UI Components contract for Quick Draft & Failed Tab", () => {
  const postsLibraryPath = path.resolve(__dirname, "../components/posts/PostsLibrary.tsx");
  const curatedTrayPath = path.resolve(__dirname, "../components/posts/CuratedPostsTray.tsx");
  const quickDraftDrawerPath = path.resolve(__dirname, "../components/posts/QuickDraftDrawer.tsx");
  const postCardPeekPath = path.resolve(__dirname, "../components/posts/PostCardPeek.tsx");

  it("PostsLibrary includes 'Failed' in SHOWS tabs with retry capability", () => {
    const src = fs.readFileSync(postsLibraryPath, "utf-8");
    // SHOWS must include failed tab
    expect(src).toMatch(/key:\s*["']failed["']/);
    expect(src).toMatch(/label:\s*["']Failed["']/);
    // Must support retry logic for failed posts
    expect(src).toMatch(/retry-publish|handleRetry/i);
    // Must feature draft generating progress banner and completion banner
    expect(src).toMatch(/isGenerating|generatingDraft|activeDraft/i);
    expect(src).toMatch(/Draft ready|Post generated/i);
  });

  it("CuratedPostsTray integrates Quick Draft into Top Three Picks", () => {
    const src = fs.readFileSync(curatedTrayPath, "utf-8");
    // Curated tray handles generating draft inside the top-3 shelf
    expect(src).toMatch(/generating|Generating draft|Writing your post/i);
    // Curated tray provides quick draft invitation card when fewer than 3 posts
    expect(src).toMatch(/Quick draft|Draft a post|onQuickDraft/i);
  });

  it("QuickDraftDrawer passes draft job payload to onDraftStarted", () => {
    const src = fs.readFileSync(quickDraftDrawerPath, "utf-8");
    // onDraftStarted must accept job details (runId or title or thought)
    expect(src).toMatch(/onDraftStarted\(\s*\{[^}]*run_?id/i);
  });

  it("PostCardPeek renders direct retry affordance for failed posts", () => {
    const src = fs.readFileSync(postCardPeekPath, "utf-8");
    // Must have retry action or button for failed posts
    expect(src).toMatch(/retry|onRetry|Try again/i);
  });
});
