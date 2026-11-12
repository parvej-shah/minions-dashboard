import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "./brand";
import type { CoverSpec } from "./layouts";
import { editAttempts, posterParts, switchLayout, type SwitchContext } from "./layoutSwitch";

const spec: CoverSpec = {
  layout: "HEADLINE",
  headline: "Why buyers leave after one call",
  kicker: "Three fixes that work.",
  author: { name: "Ada" },
  brand: DEFAULT_COVER_BRAND,
  number: { value: "3x" },
};
const ctx: SwitchContext = {
  shape: { list: { items: ["One", "Two", "Three"] } } as SwitchContext["shape"],
  photo: { present: true, ok: true },
  cutout: true,
  body: "Buyers say it. \"Speed to lead decides the deal.\" That is all.",
  post: null,
};

describe("switchLayout", () => {
  it("keeps the post's own copy and changes only the layout", () => {
    const r = switchLayout(spec, "BOLD", ctx);
    expect(r.ok && r.spec.layout).toBe("BOLD");
    expect(r.ok && r.spec.headline).toBe(spec.headline);
  });

  it("refuses a type the post cannot fill, with the same wording as before", () => {
    expect(switchLayout(spec, "GRID", ctx)).toEqual({ ok: false, error: "This post does not name 3 to 6 parallel things for a Grid cover." });
    expect(switchLayout(spec, "LIST", { ...ctx, shape: undefined })).toMatchObject({ ok: false });
    expect(switchLayout({ ...spec, number: undefined }, "NUMBER", ctx)).toEqual({ ok: false, error: "This draft has no verified figure for a NUMBER cover." });
    expect(switchLayout({ ...spec, kicker: undefined }, "TORN", ctx)).toMatchObject({ ok: false });
    expect(switchLayout(spec, "CUTOUT", { ...ctx, cutout: false })).toMatchObject({ ok: false });
  });

  it("explains a missing headshot differently from an unusable one", () => {
    const none = switchLayout(spec, "PHOTO", { ...ctx, photo: { present: false, ok: false } });
    const bad = switchLayout(spec, "PHOTO", { ...ctx, photo: { present: true, ok: false } });
    expect(none).toMatchObject({ ok: false, error: expect.stringContaining("Add a headshot") });
    expect(bad).toMatchObject({ ok: false, error: expect.stringContaining("opaque headshot") });
  });

  it("takes a QUOTE cover's sentence from the post", () => {
    const r = switchLayout(spec, "QUOTE", ctx);
    expect(r.ok && r.spec.quote).toContain("Speed to lead");
  });

  it("draws the poster items the layout needs", () => {
    const r = switchLayout(spec, "LIST", ctx);
    expect(r.ok && r.spec.list).toEqual(["One", "Two", "Three"]);
    expect(posterParts(undefined)).toEqual({ list: undefined, grid: undefined, punch: undefined });
  });
});

describe("editAttempts", () => {
  it("never falls back to a different layout for a poster or banner type", () => {
    const tries = editAttempts({ ...spec, layout: "BOLD" }, "Title");
    expect(tries.length).toBeGreaterThan(0);
    expect(tries.every((t) => t.layout === "BOLD")).toBe(true);
  });

  it("lets a plain headline layout fall back to shorter copy, ending on the plain headline", () => {
    const tries = editAttempts(spec, "A different title");
    expect(tries[0]).toEqual(spec);
    expect(tries.at(-1)?.looseHeadline).toBe(true);
  });
});
