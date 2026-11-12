import { describe, expect, it } from "vitest";
import { parseCoverLines, renderCoverLine } from "./coverLine";
import { renderStrategist } from "./strategist";

describe("cover lines come with their accent word (task 60)", () => {
  it("asks for the one word of each line to set in the accent colour", () => {
    const system = renderCoverLine({ title: "T", post: "P" }).messages[0].content;
    expect(system).toMatch(/"accent"/);
    expect(system).toMatch(/copied exactly from that line/i);
  });

  it("reads lines with accents, and plain lines from an older answer", () => {
    expect(parseCoverLines('{"lines":[{"line":"Missed calls cost listings","accent":"listings"},"Speed wins the lead"]}')).toEqual([
      { line: "Missed calls cost listings", accent: "listings" },
      { line: "Speed wins the lead" },
    ]);
  });

  it("drops an accent that is not a word of its line, and keeps the line", () => {
    expect(parseCoverLines('{"lines":[{"line":"Missed calls cost listings","accent":"buyers"}]}')).toEqual([{ line: "Missed calls cost listings" }]);
  });

  it("reads a fenced answer and gives nothing for junk", () => {
    expect(parseCoverLines('```json\n{"lines":[{"line":"A b c","accent":"c"}]}\n```')).toEqual([{ line: "A b c", accent: "c" }]);
    expect(parseCoverLines("not json")).toEqual([]);
  });
});

describe("the strategist's accent word", () => {
  it("must be copied from its headline and never be a filler word", () => {
    const system = renderStrategist({ brand_name: "Acme", target: { idea_id: "IDEA-1" }, brand_context: "ctx" }).messages[0].content;
    expect(system).toMatch(/"emphasis_word": "one word copied exactly from thumbnail_card\.headline/);
    expect(system).toMatch(/never a filler word/i);
  });
});
