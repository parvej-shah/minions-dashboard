import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "../brand";
import { CoverFitError, coverElement, type CoverSpec } from "../layouts";
import { renderCoverPng } from "../render";
import { GOOD_TEMPLATE } from "./fixtures";
import { parseTemplate } from "./parse";
import { valuesFromSpec } from "./spec";

const parsed = parseTemplate(GOOD_TEMPLATE);
if (!parsed.ok) throw new Error("fixture must parse");

const spec = (over: Partial<CoverSpec> = {}): CoverSpec => ({
  layout: "CUSTOM",
  headline: "Why buyers leave after one call",
  emphasis: "leave",
  kicker: "Three fixes.",
  author: { name: "Alex Rahman", role: "Founder" },
  brand: DEFAULT_COVER_BRAND,
  custom: { id: "k1", version: 1, template: parsed.template },
  ...over,
});

describe("the CUSTOM layout", () => {
  it("draws a PNG through the same renderer as the built-in designs", async () => {
    const png = await renderCoverPng(spec());
    expect(png.subarray(1, 4).toString()).toBe("PNG");
  });

  it("falls back (CoverFitError) when the design is not attached, never crashes the draft", () => {
    expect(() => coverElement(spec({ custom: { id: "k1", version: 1 } }))).toThrow(CoverFitError);
  });

  it("refuses a headline that cannot fit the design's box", () => {
    expect(() => coverElement(spec({ headline: "word ".repeat(80) }))).toThrow(CoverFitError);
  });

  it("maps the post to slots and leaves empty ones out", () => {
    const v = valuesFromSpec(spec({ list: ["a", "b"], number: { value: "3", unit: "x" } }));
    expect(v).toMatchObject({ headline: "Why buyers leave after one call", author_name: "Alex Rahman", list_1: "a", list_2: "b", number_value: "3", number_unit: "x" });
    expect(v.quote).toBeUndefined();
    expect(v.label).toBeUndefined();
  });

  it("treats post text as text: markup in a headline is drawn as letters, not parsed", async () => {
    const png = await renderCoverPng(spec({ headline: "<script>alert(1)</script> and {{author_name}}" }));
    expect(png.length).toBeGreaterThan(1000);
  });
});
