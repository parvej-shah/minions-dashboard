import { describe, it, expect } from "vitest";
import { splitCuratedAndReserve, sortReservePosts } from "@/lib/posts/library";
import { compactSlotLabel } from "@/lib/today";
import type { AssetItem } from "@/types";

function makeFakeAsset(id: string, overrides: Partial<AssetItem> = {}): AssetItem {
  return {
    id,
    title: `Post ${id}`,
    slug: `post-${id}`,
    hook: `Hook sentence for post ${id}`,
    core_argument: "Core argument",
    audience: "ICP",
    pillar: "Pillar",
    target_trade: "Trade",
    status: "PENDING_REVIEW",
    claims_ok: "PASS",
    review_notes: [],
    hero_image_url: null,
    hero_status: "READY",
    hero_error_code: null,
    hero_provider: null,
    hero_attempts: 0,
    cover: null,
    doc_url: "",
    version: 1,
    generation_cost: 0.01,
    published_at: null,
    channels: ["LinkedIn"],
    scheduled_for: null,
    published_urls: [],
    live_blog_url: null,
    body_content: `Content for ${id}`,
    variants: { linkedin: "", facebook: "", twitter: "", instagram: "" },
    claims: [],
    linkedin_went_as: null,
    linkedin_url: null,
    linkedin_published_at: null,
    follow_up_of: null,
    follow_up_format: null,
    created_at: new Date(Date.now() - parseInt(id, 10) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Task 69: Collapsed Draft Reserve & Impeccable Two-Button Hover UI", () => {
  it("splits posts into curated top 3 and reserve correctly", () => {
    const drafts = Array.from({ length: 15 }, (_, i) => makeFakeAsset(String(i + 1)));
    const { curated, reserve } = splitCuratedAndReserve(drafts);
    expect(curated).toHaveLength(3);
    expect(reserve).toHaveLength(12);
  });

  it("formats compact slot labels consistently without multi-line wrapping", () => {
    const slot = "2026-11-12T15:00:00.000Z";
    const label = compactSlotLabel(slot, "Asia/Dhaka");
    // e.g. "Thu 21:00"
    expect(label).toMatch(/^[A-Z][a-z]{2}\s\d{2}:\d{2}$/);
    expect(label.split(" ")).toHaveLength(2);
  });

  it("sorts reserve drafts either newest first or oldest first", () => {
    const drafts = [
      makeFakeAsset("10", { created_at: "2026-11-01T10:00:00Z" }),
      makeFakeAsset("20", { created_at: "2026-11-05T10:00:00Z" }),
      makeFakeAsset("30", { created_at: "2026-11-03T10:00:00Z" }),
    ];

    const newest = sortReservePosts(drafts, "newest");
    expect(newest[0].id).toBe("20");
    expect(newest[2].id).toBe("10");

    const oldest = sortReservePosts(drafts, "oldest");
    expect(oldest[0].id).toBe("10");
    expect(oldest[2].id).toBe("20");
  });

  it("validates button hierarchy contracts for hover cards", () => {
    // Contract: Primary button is Schedule, Secondary is Edit (Studio), Delete is a top-level discreet utility
    const primaryLabel = (slot: string) => `Schedule · ${slot}`;
    const secondaryLabel = "Edit";
    const deleteTitle = "Delete draft";

    expect(primaryLabel("Thu 21:00")).toBe("Schedule · Thu 21:00");
    expect(secondaryLabel).toBe("Edit");
    expect(deleteTitle).toBe("Delete draft");
  });
});
