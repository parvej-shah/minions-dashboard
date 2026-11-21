import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { insertDictation, micPlacement } from "@/lib/dictation";

describe("insertDictation caret anchoring", () => {
  it("inserts spoken text into an empty box", () => {
    const res = insertDictation("", "hello world");
    expect(res.text).toBe("hello world");
    expect(res.cursor).toBe(11);
  });

  it("appends to the end when range is at the end", () => {
    const base = "Existing draft text";
    const res = insertDictation(base, "added phrase", { start: base.length, end: base.length });
    expect(res.text).toBe("Existing draft text added phrase");
    expect(res.cursor).toBe("Existing draft text added phrase".length);
  });

  it("preserves newline when appending after newline", () => {
    const base = "Heading line\n";
    const res = insertDictation(base, "body text", { start: base.length, end: base.length });
    expect(res.text).toBe("Heading line\nbody text");
    expect(res.cursor).toBe("Heading line\nbody text".length);
  });

  it("inserts at caret between words with appropriate spacing", () => {
    const base = "First paragraph second paragraph";
    // Caret right between "First paragraph " and "second paragraph"
    const caret = "First paragraph ".length;
    const res = insertDictation(base, "and middle", { start: caret, end: caret });
    expect(res.text).toBe("First paragraph and middle second paragraph");
    // Cursor is right after "and middle"
    expect(res.cursor).toBe("First paragraph and middle".length);
  });

  it("adds leading space if caret is immediately after a word without space", () => {
    const base = "Word oneWord two";
    // Caret right after "one"
    const caret = 8;
    const res = insertDictation(base, "extra", { start: caret, end: caret });
    expect(res.text).toBe("Word one extra Word two");
  });

  it("replaces highlighted text selection cleanly", () => {
    const base = "The team made huge errors yesterday.";
    const start = base.indexOf("huge errors");
    const end = start + "huge errors".length;
    const res = insertDictation(base, "stellar progress", { start, end });
    expect(res.text).toBe("The team made stellar progress yesterday.");
    expect(res.cursor).toBe(start + "stellar progress".length);
  });

  it("does not insert spurious space before trailing punctuation", () => {
    const base = "Check the results.";
    const caret = base.indexOf(".");
    const res = insertDictation(base, "carefully", { start: caret, end: caret });
    expect(res.text).toBe("Check the results carefully.");
    expect(res.cursor).toBe("Check the results carefully".length);
  });

  it("returns base unchanged when spoken text is empty or blank", () => {
    const base = "Leave this alone";
    const res = insertDictation(base, "   ", { start: 5, end: 5 });
    expect(res.text).toBe("Leave this alone");
    expect(res.cursor).toBe(5);
  });
});

describe("micPlacement top-right and sticky viewport clamping", () => {
  it("places mic at top-right inside a multiline box when fully in view", () => {
    const rect = { top: 120, left: 50, width: 600, height: 400 };
    const p = micPlacement(rect, true);
    expect(p.size).toBe(36);
    expect(p.left).toBe(50 + 600 - 36 - 8);
    // Sits at top, not bottom (120 + 8 = 128)
    expect(p.top).toBe(128);
  });

  it("clamps mic to viewport top offset when box scrolls up", () => {
    // Scrolled so top is above viewport
    const rect = { top: -100, left: 50, width: 600, height: 600 };
    const p = micPlacement(rect, true, 72);
    // Stays visible at viewport top offset 72
    expect(p.top).toBe(72);
  });

  it("does not overflow past the bottom of a scrolled box", () => {
    // Box almost scrolled away: bottom is at 60px
    const rect = { top: -400, left: 50, width: 600, height: 460 };
    // bottom = -400 + 460 = 60; maxTop = 60 - 36 - 8 = 16
    const p = micPlacement(rect, true, 72);
    expect(p.top).toBeLessThanOrEqual(60 - 36);
  });
});

describe("GlobalDictation and DictationMic shortcuts & caret integration", () => {
  it("GlobalDictation wires selection range and Alt+D key listener", () => {
    const src = readFileSync(path.resolve(__dirname, "../components/ui/GlobalDictation.tsx"), "utf8");
    // Passes selection getter or range to useDictation
    expect(src).toMatch(/selectionStart/);
    // Dispatches or sets selection range in writeField
    expect(src).toMatch(/setSelectionRange/);
    // Supports Alt+D keyboard shortcut
    expect(src).toMatch(/Alt\+D/i);
  });

  it("DictationMic advertises Alt+D shortcut in its tooltip and aria", () => {
    const src = readFileSync(path.resolve(__dirname, "../components/ui/DictationMic.tsx"), "utf8");
    expect(src).toMatch(/Alt\+D/);
  });
});
