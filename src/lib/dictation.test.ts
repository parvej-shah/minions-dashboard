import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { dictationErrorMessage, dictationLanguage, getRecognitionCtor, isDictatable, joinDictation, micPlacement } from "./dictation";

describe("joinDictation", () => {
  it("returns the spoken text when the box is empty", () => {
    expect(joinDictation("", " hello there ")).toBe("hello there");
  });
  it("appends with exactly one space", () => {
    expect(joinDictation("We shipped", "the new agent")).toBe("We shipped the new agent");
    expect(joinDictation("We shipped ", "the new agent")).toBe("We shipped the new agent");
  });
  it("keeps a trailing newline instead of adding a space", () => {
    expect(joinDictation("Line one\n", "line two")).toBe("Line one\nline two");
  });
  it("leaves the box alone when nothing was said", () => {
    expect(joinDictation("Typed", "   ")).toBe("Typed");
  });
});

describe("getRecognitionCtor", () => {
  it("is null without speech recognition (Firefox, server)", () => {
    expect(getRecognitionCtor(undefined)).toBeNull();
    expect(getRecognitionCtor({})).toBeNull();
  });
  it("finds the standard and the webkit constructor", () => {
    class R {}
    expect(getRecognitionCtor({ SpeechRecognition: R })).toBe(R);
    expect(getRecognitionCtor({ webkitSpeechRecognition: R })).toBe(R);
  });
});

describe("dictationLanguage", () => {
  it("follows the browser and falls back to en-US", () => {
    expect(dictationLanguage("bn-BD")).toBe("bn-BD");
    expect(dictationLanguage(undefined)).toBe("en-US");
    expect(dictationLanguage("")).toBe("en-US");
  });
});

describe("dictationErrorMessage", () => {
  it("says how to fix a blocked microphone", () => {
    expect(dictationErrorMessage("not-allowed")).toMatch(/allow the microphone/i);
    expect(dictationErrorMessage("service-not-allowed")).toMatch(/allow the microphone/i);
  });
  it("is silent for a stop or silence", () => {
    expect(dictationErrorMessage("aborted")).toBeNull();
    expect(dictationErrorMessage("no-speech")).toBeNull();
  });
  it("has plain copy for anything else", () => {
    expect(dictationErrorMessage("network")).toMatch(/connection/i);
    expect(dictationErrorMessage("weird")).toBeTruthy();
  });
});

describe("update boxes offer dictation", () => {
  const files = [
    "components/posts/QuickDraftDrawer.tsx",
    "components/pulse/WeeklyPulseCard.tsx",
    "components/pulse/ApprovalUpdateAsk.tsx",
    "components/brand/MemoryComposer.tsx",
  ];
  for (const f of files) {
    it(f, () => {
      const src = readFileSync(path.resolve(__dirname, "..", f), "utf8");
      expect(src).toMatch(/<DictationButton\b/);
      expect(src).toMatch(/data-no-dictation/);
    });
  }
});

describe("isDictatable", () => {
  const field = (o: Partial<Parameters<typeof isDictatable>[0]>) => ({ tag: "TEXTAREA", type: "", readOnly: false, disabled: false, optedOut: false, ...o });
  it("allows text boxes and plain text inputs", () => {
    expect(isDictatable(field({}))).toBe(true);
    expect(isDictatable(field({ tag: "INPUT", type: "text" }))).toBe(true);
    expect(isDictatable(field({ tag: "INPUT", type: "search" }))).toBe(true);
    expect(isDictatable(field({ tag: "INPUT", type: "" }))).toBe(true);
  });
  it("refuses non-prose inputs", () => {
    for (const type of ["password", "email", "url", "number", "tel", "date", "checkbox", "file"]) {
      expect(isDictatable(field({ tag: "INPUT", type }))).toBe(false);
    }
    expect(isDictatable(field({ tag: "SELECT" }))).toBe(false);
  });
  it("refuses read-only, disabled and opted-out fields", () => {
    expect(isDictatable(field({ readOnly: true }))).toBe(false);
    expect(isDictatable(field({ disabled: true }))).toBe(false);
    expect(isDictatable(field({ optedOut: true }))).toBe(false);
  });
});

describe("micPlacement", () => {
  it("sits bottom-right inside a text box", () => {
    const p = micPlacement({ top: 100, left: 20, width: 300, height: 120 }, true);
    expect(p.size).toBe(36);
    expect(p.left + p.size).toBeLessThanOrEqual(320);
    expect(p.top + p.size).toBeLessThanOrEqual(220);
    expect(p.top).toBeGreaterThan(160);
  });
  it("is centred on the right of an input and shrinks for short ones", () => {
    const p = micPlacement({ top: 0, left: 0, width: 200, height: 44 }, false);
    expect(p.top).toBe((44 - p.size) / 2);
    expect(p.left + p.size).toBeLessThanOrEqual(200);
    expect(micPlacement({ top: 0, left: 0, width: 200, height: 30 }, false).size).toBeLessThanOrEqual(26);
  });
});

describe("every typing field offers dictation", () => {
  it("root layout mounts the shared mic", () => {
    const src = readFileSync(path.resolve(__dirname, "../app/layout.tsx"), "utf8");
    expect(src).toMatch(/<GlobalDictation\b/);
  });
});
