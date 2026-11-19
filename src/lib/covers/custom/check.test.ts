import { describe, expect, it } from "vitest";
import { checkTemplate } from "./check";
import { GOOD_TEMPLATE } from "./fixtures";
import { contractPrompt } from "./contract";

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

  it("the prompt we show users produces text that names every required slot", () => {
    const p = contractPrompt();
    expect(p).toContain("{{headline}}");
    expect(p).toContain("{{author_name}}");
    expect(p).toContain('data-cover-template="1"');
  });
});
