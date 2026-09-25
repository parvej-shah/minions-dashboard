import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/r2", () => ({ uploadToR2: vi.fn(), deleteFromR2: vi.fn(), r2KeyFromUrl: vi.fn() }));

const { isPublished } = await import("./cover");

describe("a published draft's cover is locked", () => {
  const draft = { status: "PENDING_REVIEW", publishedAt: null, linkedinPublishedAt: null, facebookPublishedAt: null };

  it("stays editable until it goes out anywhere", () => {
    expect(isPublished(draft)).toBe(false);
    expect(isPublished({ ...draft, status: "PUBLISHED" })).toBe(true);
    expect(isPublished({ ...draft, linkedinPublishedAt: new Date() })).toBe(true);
    expect(isPublished({ ...draft, facebookPublishedAt: new Date() })).toBe(true);
  });
});
