import { describe, expect, it } from "vitest";
import { renderVariants } from "./variants";

const system = renderVariants({
  company_name: "Acme",
  hook: "Missed calls are booked tours you never see.",
  edited_body: "Body",
  brand_context: "",
  tone_questionnaire: null,
  tone_examples: [],
  audience: "ICP",
  title: "T",
}).messages[0].content;

describe("the variants prompt", () => {
  it("asks for an Instagram caption alongside the other three", () => {
    expect(system).toContain('"ig_variant"');
    expect(system).toMatch(/INSTAGRAM VARIANT/);
    expect(system).toMatch(/3 to 5/);
    expect(system).toMatch(/125 characters/);
  });

  it("keeps the Facebook caption short and opens it on the hook, since the image leads", () => {
    const fb = system.slice(system.indexOf("FACEBOOK VARIANT"), system.indexOf("TWITTER / X VARIANT"));
    expect(fb).toMatch(/HARD LIMIT 110 words/);
    expect(fb).toMatch(/first line/i);
    expect(fb).toMatch(/Pre-Crafted Hook/);
  });
});
