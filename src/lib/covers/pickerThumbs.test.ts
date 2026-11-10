import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { COVER_LAYOUTS } from "./layouts";
import { SLIDE_STYLES } from "@/lib/carousel/slides";
import { carouselThumb, coverThumb, pickerLayouts, PICKER_THUMB_DIR } from "./pickerThumbs";
import type { LayoutFacts } from "./available";

const bare: LayoutFacts = { shape_read: true, list: null, grid: null, punch: null, number: null, photo_ok: false, quote_ok: false, kicker: null, cutout_ok: false };

describe("picker sample pictures", () => {
  it("has a sample picture for every cover layout and every carousel design", () => {
    for (const l of COVER_LAYOUTS) expect(existsSync(join("public", coverThumb(l)))).toBe(true);
    for (const s of SLIDE_STYLES) expect(existsSync(join("public", carouselThumb(s)))).toBe(true);
  });

  it("serves them from the picker folder", () => {
    expect(coverThumb("HEADLINE")).toBe(`/${PICKER_THUMB_DIR}/cover-headline.webp`);
    expect(carouselThumb("AURORA")).toBe(`/${PICKER_THUMB_DIR}/carousel-aurora.webp`);
  });
});

describe("pickerLayouts", () => {
  it("suggests the current layout first, then the layouts this post's content fills, four at most", () => {
    const facts = { ...bare, number: { value: "3x" }, list: ["a", "b", "c"], quote_ok: true, photo_ok: true };
    const { suggested } = pickerLayouts("BOLD", facts);
    expect(suggested).toEqual(["BOLD", "PHOTO", "NUMBER", "QUOTE"]);
  });

  it("fills the suggestions with headline layouts when the post has no special content", () => {
    const { suggested } = pickerLayouts("HEADLINE", bare);
    expect(suggested).toHaveLength(4);
    expect(suggested[0]).toBe("HEADLINE");
    expect(new Set(suggested).size).toBe(4);
  });

  it("hides layouts this cover can't be drawn in, and lists every other one once", () => {
    const { suggested, rest } = pickerLayouts("HEADLINE", bare);
    const all = [...suggested, ...rest];
    for (const l of ["LIST", "GRID", "PUNCH", "NUMBER", "PHOTO", "QUOTE", "TORN", "CUTOUT"]) expect(all).not.toContain(l);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(COVER_LAYOUTS.length - 8);
  });

  it("always keeps the current layout, even if it could no longer be drawn", () => {
    expect(pickerLayouts("NUMBER", bare).suggested[0]).toBe("NUMBER");
  });
});
