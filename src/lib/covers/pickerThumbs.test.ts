import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { COVER_LAYOUTS } from "./layouts";
import { SLIDE_STYLES } from "@/lib/carousel/slides";
import { carouselThumb, coverPreviewUrl, coverThumb, designFromTile, designPreviewUrl, designTileId, orderDesigns, pickedTile, shownCover, tilesToDraw, pickerLayouts, previewVersion, PICKER_THUMB_DIR } from "./pickerThumbs";
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

describe("live layout tiles", () => {
  const cover = { headline: "Why buyers leave", emphasis: null, kicker: "Three fixes.", quote: null, number: null, list: null, grid: null, punch: null, art_style: "SHAPES", author: { name: "Ada", role: "Founder" } };

  it("addresses one tile per layout, with the text version in the query", () => {
    expect(coverPreviewUrl("a1", "BOLD", "abc")).toBe("/api/assets/a1/cover/preview?layout=BOLD&v=abc");
  });

  it("keeps the same version when only the chosen layout changes", () => {
    expect(previewVersion({ ...cover, layout: "BOLD" })).toBe(previewVersion({ ...cover, layout: "HEADLINE" }));
  });

  it("changes the version when the post's wording changes", () => {
    expect(previewVersion({ ...cover, layout: "BOLD" })).not.toBe(previewVersion({ ...cover, layout: "BOLD", headline: "Why buyers stay" }));
    expect(previewVersion({ ...cover, layout: "BOLD" })).not.toBe(previewVersion({ ...cover, layout: "BOLD", list: ["a", "b", "c"] }));
  });

  it("shows the clicked tile in place of the cover until the new cover arrives", () => {
    const preview = { from: "https://cdn/old.png", src: "/api/assets/a1/cover/preview?layout=BOLD&v=x" };
    expect(shownCover("https://cdn/old.png", preview)).toBe(preview.src);
    // The real cover replaced the old file: the tile has done its job.
    expect(shownCover("https://cdn/new.png", preview)).toBe("https://cdn/new.png");
    expect(shownCover("https://cdn/old.png", null)).toBe("https://cdn/old.png");
  });

  it("draws the tiles one after another, in order, so each fills in as soon as it is ready", () => {
    const srcs = ["a", "b", "c", undefined, "d"];
    // Nothing is back yet: only the first is asked for.
    expect(tilesToDraw(srcs, new Set())).toBe(1);
    // The first arrived: the second is next.
    expect(tilesToDraw(srcs, new Set(["a"]))).toBe(2);
    // A tile with no live picture never holds up the ones after it.
    expect(tilesToDraw(srcs, new Set(["a", "b", "c"]))).toBe(5);
    // A tile that came back out of turn does not skip the one before it.
    expect(tilesToDraw(srcs, new Set(["b"]))).toBe(1);
    // All back: all of them.
    expect(tilesToDraw(srcs, new Set(["a", "b", "c", "d"]))).toBe(5);
    expect(tilesToDraw([], new Set())).toBe(0);
  });
});

describe("the workspace's own designs in the picker (task 100)", () => {
  it("gives each design a tile id that reads back to the design, and no built-in layout reads as one", () => {
    expect(designFromTile(designTileId("abc-123"))).toBe("abc-123");
    expect(designFromTile("BOLD")).toBeNull();
    expect(designFromTile("design:")).toBeNull();
  });

  it("never offers CUSTOM as a built-in tile, even when the cover is drawn in a design", () => {
    const { suggested, rest } = pickerLayouts("CUSTOM", bare);
    expect([...suggested, ...rest]).not.toContain("CUSTOM");
    expect(suggested).toHaveLength(4);
  });

  it("puts the design the cover uses first", () => {
    const ds = [{ id: "a", version: 1 }, { id: "b", version: 3 }];
    expect(orderDesigns(ds, "b").map((d) => d.id)).toEqual(["b", "a"]);
    expect(orderDesigns(ds, undefined).map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("marks the current design's tile as picked, and a built-in layout as itself", () => {
    expect(pickedTile({ layout: "CUSTOM", custom: { id: "a", version: 2 } })).toBe(designTileId("a"));
    expect(pickedTile({ layout: "BOLD", custom: null })).toBe("BOLD");
  });

  it("names the design's version in the tile address, so a new version draws a new tile", () => {
    const one = designPreviewUrl("as1", { id: "d1", version: 1 }, "v9");
    const two = designPreviewUrl("as1", { id: "d1", version: 2 }, "v9");
    expect(one).not.toBe(two);
    expect(one).toBe("/api/assets/as1/cover/preview?design=d1&dv=1&v=v9");
    expect(coverPreviewUrl("as1", "BOLD", "v9").endsWith("&v=v9")).toBe(true);
  });
});
