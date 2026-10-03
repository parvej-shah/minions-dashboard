import { describe, expect, it } from "vitest";
import { metricsFor } from "./fonts";
import { textWidth } from "./metrics";
import { fit, wrap } from "./fit";
import { audienceLabel, chooseCoverCopy, coverOutOfDate, pickLayout, pickQuote, scoreHeadline, type CoverCopyInput } from "./copy";
import { contrast, coverBrand, DEFAULT_COVER_BRAND } from "./brand";
import { coverElement, CoverFitError, type CoverSpec } from "./layouts";
import { renderCoverPng } from "./render";
import { defaultByline, withCoverLine } from "@/services/cover";

describe("text is measured from the bundled fonts", () => {
  it("reads real advance widths", () => {
    const serif = metricsFor("serif");
    expect(textWidth(serif, "W", 100)).toBeGreaterThan(textWidth(serif, "i", 100));
    expect(textWidth(serif, "abc", 100)).toBeCloseTo(textWidth(serif, "a", 100) + textWidth(serif, "b", 100) + textWidth(serif, "c", 100));
    expect(textWidth(serif, "ab", 100, 5)).toBeCloseTo(textWidth(serif, "ab", 100) + 10);
  });

  it("breaks lines within the width, and never cuts a word", () => {
    const text = "Your voice agent confirms bookings that never reach the calendar";
    const lines = wrap(text, 120, { face: "serif", maxWidth: 904, maxLines: 9 });
    expect(lines.join(" ")).toBe(text);
    expect(lines.every((l) => textWidth(metricsFor("serif"), l, 120) <= 904)).toBe(true);
  });

  it("picks the largest size that fits the lines and the height, or refuses", () => {
    const box = { face: "serif" as const, maxWidth: 904, maxLines: 5 };
    const free = fit("Ask for the schema, not the demo", 72, 150, box)!;
    const short = fit("Ask for the schema, not the demo", 72, 150, { ...box, maxHeight: 300, lineHeight: 1.05 })!;
    expect(short.size).toBeLessThan(free.size);
    expect(short.lines.length * short.size * 1.05).toBeLessThanOrEqual(300);
    expect(fit(Array(40).fill("word").join(" "), 72, 150, box)).toBeNull();
  });
});

const body = [
  "Our first booking agent confirmed appointments that never reached the calendar.",
  "The webhook timed out silently for 3 seconds and nobody noticed.",
  "",
  "Not because the model was wrong, but because the write failed.",
  "",
  "A booking only exists when your calendar confirms it, not when the caller hears yes.",
].join("\n");

const input: CoverCopyInput = {
  card: { headline: "Your voice agent confirms bookings that never reach the calendar", subtitle: "The caller thinks they are set while you lose the lead.", emphasis_word: "never" },
  title: "Silent booking failures",
  hook: "h",
  body,
  claimsOk: "Y",
  icp: { who: "Real estate team leaders", role: "Team leader", company_type: "Real estate brokerages and teams" },
  recentLayouts: [],
};

describe("cover copy is chosen and checked in code", () => {
  it("scores a headline for length, clarity and figures", () => {
    expect(scoreHeadline(input.card.headline!, input)).toMatchObject({ words: 10, length: 0.5, problems: [] });
    expect(scoreHeadline("Why we moved from regex to Jev", input)).toMatchObject({ length: 1, problems: [] });
    expect(scoreHeadline("Unversioned automation workflows silently corrupt attribution across interconnected marketing infrastructure", input).problems.join()).toMatch(/three lines/);
    expect(scoreHeadline("Fluency vs accuracy", input).problems.join()).toMatch(/topic/);
    expect(scoreHeadline("Cut no-shows by 40% this quarter", input).problems.join()).toMatch(/40/);
  });

  it("falls back to the title when the strategist headline fails", () => {
    const copy = chooseCoverCopy({ ...input, card: { headline: "AI Scheduling Explained" }, recentLayouts: ["NUMBER", "QUOTE"] });
    expect(copy.headline_source).toBe("title");
    expect(copy.headline).toBe("Silent booking failures");
    expect(copy.notes.join()).toMatch(/topic/);
  });

  it("sets ALL CAPS copy in sentence case", () => {
    expect(chooseCoverCopy({ ...input, card: { headline: "YOUR AGENT CONFIRMS BOOKINGS THAT NEVER LAND" }, recentLayouts: ["QUOTE"] }).headline).toBe("Your agent confirms bookings that never land");
  });

  it("drops a subtitle that states a figure the draft does not", () => {
    const copy = chooseCoverCopy({ ...input, card: { ...input.card, subtitle: "Teams lose 30% of leads this way." }, recentLayouts: ["QUOTE", "STATEMENT"] });
    expect(copy.kicker).toBeUndefined();
  });

  it("uses a NUMBER only when the draft states it and the draft is not blocked", () => {
    const card = { ...input.card, number: { value: "3", unit: "seconds", caption: "of silence and the booking was gone" } };
    const judged = { number: true };
    expect(chooseCoverCopy({ ...input, card, judged }).layout).toBe("NUMBER");
    expect(chooseCoverCopy({ ...input, card: { ...card, number: { ...card.number, value: "40" } }, judged }).layout).not.toBe("NUMBER");
    const blocked = chooseCoverCopy({ ...input, card, claimsOk: "BLOCKED", judged });
    expect(blocked.layout).not.toBe("NUMBER");
    expect(blocked.notes.join()).toMatch(/blocked/);
  });

  it("leads with the headline unless the figure or quote was judged to make the point alone", () => {
    const card = { ...input.card, number: { value: "3", unit: "seconds", caption: "of silence and the booking was gone" } };
    const plain = chooseCoverCopy({ ...input, card, recentLayouts: [] });
    expect(plain.layout).toBe("STATEMENT");
    expect(plain.number).toEqual({ value: "3", unit: "seconds" });
    expect(plain.notes.join()).toMatch(/No NUMBER cover.*No QUOTE cover/);
    expect(chooseCoverCopy({ ...input, recentLayouts: [], judged: { quote: true } }).layout).toBe("QUOTE");
    // A judged quote still never runs twice in a row.
    expect(chooseCoverCopy({ ...input, recentLayouts: ["QUOTE"], judged: { quote: true } }).layout).toBe("STATEMENT");
  });

  it("drops the subtitle under a long headline", () => {
    const copy = chooseCoverCopy({ ...input, card: { ...input.card, headline: "Your agent books showings your calendar never sees" }, recentLayouts: [] });
    expect(copy.kicker).toBe(input.card.subtitle);
    expect(chooseCoverCopy({ ...input, recentLayouts: [] }).kicker).toBeUndefined();
  });

  it("finds when a drawn cover no longer matches its draft", () => {
    const draft = { title: "Silent booking failures", body };
    expect(coverOutOfDate({ layout: "QUOTE", quote: "A booking only exists when your calendar confirms it, not when the caller hears yes.", headline: "x" }, draft)).toBeNull();
    expect(coverOutOfDate({ layout: "QUOTE", quote: "A line that was edited out of the post." }, draft)).toMatch(/quote/);
    expect(coverOutOfDate({ layout: "NUMBER", headline: "of silence", number: { value: "5" } }, draft)).toMatch(/5/);
    expect(coverOutOfDate({ layout: "HEADLINE", headline: "Old title", headline_source: "title" }, draft)).toMatch(/title/);
    expect(coverOutOfDate({ layout: "HEADLINE", headline: "My own words", headline_source: "reviewer" }, draft)).toBeNull();
    // The quote must be in the LinkedIn post the cover is seen beside.
    expect(coverOutOfDate({ layout: "QUOTE", quote: "A booking only exists when your calendar confirms it, not when the caller hears yes." }, { ...draft, post: "A shorter LinkedIn version." })).toMatch(/quote/);
  });

  it("quotes the LinkedIn post when the draft has one", () => {
    const post = "We lost bookings for a month. A booking is real only when your calendar has it, never when the caller hears yes.";
    expect(chooseCoverCopy({ ...input, post, recentLayouts: [], judged: { quote: true } }).quote).toBe("A booking is real only when your calendar has it, never when the caller hears yes.");
  });

  it("quotes a body sentence word for word that stands alone", () => {
    const quote = pickQuote(body)!;
    expect(body.replace(/\n/g, " ")).toContain(quote);
    expect(quote).toBe("A booking only exists when your calendar confirms it, not when the caller hears yes.");
    expect(pickQuote("Not because the model was wrong, but because the write failed.")).toBeUndefined();
  });

  it("prefers the dark STATEMENT over HEADLINE when there is no figure or quote", () => {
    expect(chooseCoverCopy({ ...input, body: "Not because the model was wrong, but because the write failed.", recentLayouts: [] }).layout).toBe("STATEMENT");
  });

  it("draws the layout it is told to, skipping the figure and quote (the first post)", () => {
    const card = { ...input.card, number: { value: "3", unit: "seconds", caption: "of silence and the booking was gone" } };
    const copy = chooseCoverCopy({ ...input, card, layout: "STATEMENT", recentLayouts: ["STATEMENT"] });
    expect(copy.layout).toBe("STATEMENT");
    expect(copy.number).toBeUndefined();
  });

  it("rotates layouts: least recently used, never the last one twice", () => {
    expect(pickLayout(["HEADLINE", "STATEMENT"], ["HEADLINE"])).toBe("STATEMENT");
    expect(pickLayout(["QUOTE", "HEADLINE", "STATEMENT"], ["QUOTE", "STATEMENT", "HEADLINE"])).toBe("HEADLINE");
    expect(pickLayout(["HEADLINE"], ["HEADLINE"])).toBe("HEADLINE");
  });

  it("labels the audience from the ICP", () => {
    expect(audienceLabel(input.icp)).toBe("For real estate brokerages and teams");
    expect(audienceLabel({ who: "x", role: "", company_type: "" })).toBeUndefined();
  });
});

describe("brand colours are checked for contrast", () => {
  it("deepens an accent too light for the paper, and keeps it on ink", () => {
    const { brand, notes } = coverBrand({ ink: "#12242A", paper: "#FFF8F0", accent: "#FF6B4A", secondary: "#0E5C63" });
    expect(contrast(brand.accent, brand.paper)).toBeGreaterThanOrEqual(3);
    expect(brand.accentOnInk).toBe("#ff6b4a");
    expect(notes).toHaveLength(1);
  });

  it("replaces unreadable ink and paper with the defaults", () => {
    const { brand } = coverBrand({ ink: "#777777", paper: "#FFFFFF", accent: "nonsense", secondary: "#EEEEEE" });
    expect(brand.ink).toBe(DEFAULT_COVER_BRAND.ink);
    expect(brand.secondary).toBe(brand.ink);
  });
});

describe("the cover", () => {
  const spec: CoverSpec = { layout: "HEADLINE", label: "For real estate teams", headline: "Ask for the schema, not the demo", emphasis: "schema", kicker: "A booked showing only exists when your systems confirm it.", author: { name: "Parvej Shah", role: "Founder of Minions.AI" }, brand: coverBrand({}).brand };

  it("renders every layout to a PNG", async () => {
    for (const layout of ["HEADLINE", "STATEMENT", "QUOTE", "NUMBER"] as const) {
      const png = await renderCoverPng({ ...spec, layout, quote: "A booking only exists when your calendar confirms it.", number: { value: "3", unit: "seconds" } });
      expect(png.subarray(1, 4).toString()).toBe("PNG");
    }
  }, 30000);

  it("refuses copy that cannot fit rather than cutting it", () => {
    expect(() => coverElement({ ...spec, headline: Array(60).fill("word").join(" ") })).toThrow(CoverFitError);
  });

  it("puts the cover line at the top of the draft, replacing an older one", () => {
    expect(withCoverLine("![Old](https://x/old.png)\n\nBody.", "T [1]", "https://x/new.png")).toBe("![T 1](https://x/new.png)\n\nBody.");
    expect(withCoverLine("Body.", "T", "https://x/new.png")).toBe("![T](https://x/new.png)\n\nBody.");
  });

  it("takes the byline from the positioning's first sentence when it is short", () => {
    expect(defaultByline("Founder of Minions.AI. I build voice agents.")).toBe("Founder of Minions.AI");
    expect(defaultByline("x".repeat(120))).toBeUndefined();
  });
});
