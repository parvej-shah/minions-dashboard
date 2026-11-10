import { describe, expect, it } from "vitest";
import { instagramDeck, instagramFormatFor } from "./instagramFormat";

const PAGES = ["https://r2/c/01.jpg", "https://r2/c/02.jpg", "https://r2/c/03.jpg"];
const spec = (extra: Record<string, unknown> = {}) => ({ active: false, pdf_url: "https://r2/c/c.pdf", pages: PAGES, ...extra });

describe("which format Instagram gets", () => {
  it("defaults to the carousel, whatever LinkedIn gets", () => {
    expect(instagramFormatFor(spec(), null)).toBe("CAROUSEL");
  });
  it("follows the workspace's last pick when the draft has none", () => {
    expect(instagramFormatFor(spec(), "SINGLE")).toBe("SINGLE");
  });
  it("lets the draft's own pick win", () => {
    expect(instagramFormatFor(spec({ instagram_format: "CAROUSEL" }), "SINGLE")).toBe("CAROUSEL");
    expect(instagramFormatFor(spec({ instagram_format: "SINGLE" }), "CAROUSEL")).toBe("SINGLE");
  });
  it("is a single poster with no carousel, one page, or PNG pages", () => {
    expect(instagramFormatFor(null, "CAROUSEL")).toBe("SINGLE");
    expect(instagramDeck(spec({ pages: [PAGES[0]] }))).toEqual([]);
    expect(instagramDeck(spec({ pages: ["https://r2/c/01.png", "https://r2/c/02.png"] }))).toEqual([]);
    expect(instagramFormatFor(spec({ pages: [PAGES[0]] }), "CAROUSEL")).toBe("SINGLE");
  });
  it("keeps at most ten pages", () => {
    expect(instagramDeck(spec({ pages: Array.from({ length: 12 }, (_, i) => `https://r2/c/${i}.jpg`) }))).toHaveLength(10);
  });
});
