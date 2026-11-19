import { describe, expect, it } from "vitest";
import { checkTemplate } from "./check";
import { GOOD_TEMPLATE } from "./fixtures";
import { contractPrompt, PROMPT_EXAMPLE, LIMITS, MIN_SIZE, MAX_LINES, MAX_SIZE, STYLE_PROPS, TAGS, FONTS, SAMPLE_POSTS } from "./contract";

describe("checkTemplate", () => {
  it("passes a template that follows the contract and draws three previews", async () => {
    const r = await checkTemplate(GOOD_TEMPLATE);
    expect(r.ok, r.ok ? "" : r.errors.join("; ")).toBe(true);
    if (r.ok) {
      expect(r.previews.map((p) => p.name)).toEqual(["short", "long", "bare"]);
      for (const p of r.previews) expect(p.svg).toMatch(/^<svg/);
    }
  });

  it("refuses a contract mismatch without drawing anything", async () => {
    const r = await checkTemplate(GOOD_TEMPLATE.replace("<div data-cover-template", "<script>1</script><div data-cover-template"));
    expect(r.ok).toBe(false);
  });

  it("refuses text that is too low-contrast on the brand colours", async () => {
    const r = await checkTemplate(GOOD_TEMPLATE.replace("color:var(--ink)", "color:var(--paper)"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/needs at least 4.5:1/);
  });

  it("refuses a design whose text ignores the theme colours", async () => {
    const r = await checkTemplate(GOOD_TEMPLATE.replace("line-height:1.05;color:var(--ink)", "line-height:1.05;color:#123456"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/must be a theme colour/);
  });

  it("refuses a headline box too narrow for the longest post", async () => {
    const r = await checkTemplate(GOOD_TEMPLATE.replace('data-max-lines="3" data-min-size="48" data-max-size="120"', 'data-max-lines="1" data-min-size="100" data-max-size="120"'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/does not fit/);
  });

  it("refuses a headshot that would be stretched", async () => {
    const r = await checkTemplate(GOOD_TEMPLATE.replace("object-fit:cover;", ""));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/headshot needs object-fit:cover/);
  });

  it("draws the workspace's own pictures when it has them", async () => {
    const mine = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const r = await checkTemplate(PROMPT_EXAMPLE, undefined, async () => ({ photo: mine, cutout: mine }));
    expect(r.ok, r.ok ? "" : r.errors.join("; ")).toBe(true);
    if (r.ok) {
      expect(r.previews.find((p) => p.name === "long")!.svg).toContain(mine);
      expect(r.standIns).toEqual([]);
    }
  });

  it("draws stand-ins and names them when the workspace has no pictures", async () => {
    const r = await checkTemplate(PROMPT_EXAMPLE, undefined, async () => ({}));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.standIns.sort()).toEqual(["cutout", "photo"]);
  });

  it("does not read the workspace's pictures for a design that uses none", async () => {
    let called = false;
    const noPics = GOOD_TEMPLATE.replace(/<div data-if="photo"[^\n]*<\/div>\n/, "");
    const r = await checkTemplate(noPics, undefined, async () => ((called = true), {}));
    expect(r.ok, r.ok ? "" : r.errors.join("; ")).toBe(true);
    expect(called).toBe(false);
    if (r.ok) expect(r.standIns).toEqual([]);
  });

  it("the instructions explain the photo and the cut-out", () => {
    const p = contractPrompt();
    for (const rule of ["{{photo}}", "{{cutout}}", "object-fit:contain", "object-position:bottom", "object-fit:cover", "transparent background", "taller than", "bottom edge", "over the person", "without", "Brand page"]) expect(p, rule).toContain(rule);
    expect(PROMPT_EXAMPLE).toContain("{{cutout}}");
  });

  it("the example in the instructions passes the check", async () => {
    const r = await checkTemplate(PROMPT_EXAMPLE);
    expect(r.ok, r.ok ? "" : r.errors.join("; ")).toBe(true);
    expect(contractPrompt()).toContain(PROMPT_EXAMPLE);
  });

  it("the instructions state every rule the check enforces", () => {
    const p = contractPrompt();
    for (const t of TAGS) expect(p, t).toContain(t);
    for (const s of STYLE_PROPS) expect(p, s).toContain(s);
    for (const f of FONTS) expect(p, f).toContain(f);
    for (const n of [MIN_SIZE.headline, MIN_SIZE.other, MAX_LINES, MAX_SIZE, LIMITS.nodes, LIMITS.depth, LIMITS.styleChars, LIMITS.textChars, LIMITS.nameChars]) expect(p).toContain(String(n));
    expect(p).toContain(`${LIMITS.sourceBytes / 1024} KB`);
    expect(p).toContain(`${LIMITS.inlineImageBytes / 1024} KB`);
    expect(p).toContain(SAMPLE_POSTS.long.headline);
    for (const rule of ["letter-spacing", "text-transform", "padding", "border", "calc()", "z-index", "class", "<style>", "<script>", "web address", "data-if", "data-emphasis-color", "data-emphasis-font", "4.5:1", "line-height", "url(#", "data:image/png"]) expect(p, rule).toContain(rule);
  });

  it("the prompt we show users produces text that names every required slot", () => {
    const p = contractPrompt();
    expect(p).toContain("{{headline}}");
    expect(p).toContain("{{author_name}}");
    expect(p).toContain('data-cover-template="1"');
  });
});
