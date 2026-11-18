import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { dictationErrorMessage, dictationLanguage, getRecognitionCtor, joinDictation } from "./dictation";

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
    });
  }
});
