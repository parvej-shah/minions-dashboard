import { describe, expect, it, vi } from "vitest";
import { buildSetupHintsPrompt, cleanHint, generateSetupHints, parseSetupHints } from "./setupHints";

vi.mock("./brandCopilot", () => ({ callQwen: vi.fn(async () => null), ONBOARDING_MODEL: { model: "m", temperature: 0.7, max_tokens: 800 } }));

describe("setup hints prompt", () => {
  it("asks for an audience example from the focus alone", () => {
    const prompt = buildSetupHintsPrompt({ field: "audience", contentFocus: "Tax planning for dentists" });
    expect(prompt).toContain("Tax planning for dentists");
    expect(prompt).toContain('"hint"');
    expect(prompt).not.toContain("Who they write for");
  });

  it("asks for a story example from the focus and the audience", () => {
    const prompt = buildSetupHintsPrompt({ field: "story", contentFocus: "Tax planning for dentists", audienceDescription: "Owners of 2-chair practices" });
    expect(prompt).toContain("Tax planning for dentists");
    expect(prompt).toContain("Owners of 2-chair practices");
  });
});

describe("cleaning a hint", () => {
  it("keeps one short line without e.g., quotes or a trailing full stop", () => {
    expect(cleanHint('e.g. "Owners of 2-chair dental practices."')).toBe("Owners of 2-chair dental practices");
    expect(cleanHint("Practice owners\nwho hate tax season")).toBe("Practice owners who hate tax season");
  });

  it("keeps the ellipsis a story example ends on", () => {
    expect(cleanHint("The practice that paid $40k too much tax until…")).toBe("The practice that paid $40k too much tax until…");
  });

  it("rejects empty, too-short and overlong hints", () => {
    expect(cleanHint("")).toBeNull();
    expect(cleanHint("ok")).toBeNull();
    expect(cleanHint("x".repeat(200))).toBeNull();
    expect(cleanHint(42)).toBeNull();
  });
});

describe("parsing the reply", () => {
  it("reads the hint from JSON, fenced or not", () => {
    expect(parseSetupHints('{"hint":"Owners of 2-chair practices"}')).toBe("Owners of 2-chair practices");
    expect(parseSetupHints('```json\n{"hint":"Owners of 2-chair practices"}\n```')).toBe("Owners of 2-chair practices");
  });

  it("is null for anything else", () => {
    expect(parseSetupHints(null)).toBeNull();
    expect(parseSetupHints("not json")).toBeNull();
    expect(parseSetupHints('{"other":"x"}')).toBeNull();
  });
});

describe("generating", () => {
  it("is null without an answer to build on, and when the model is unavailable", async () => {
    expect(await generateSetupHints({ field: "audience", contentFocus: "  " })).toBeNull();
    expect(await generateSetupHints({ field: "audience", contentFocus: "Tax planning for dentists" })).toBeNull();
  });
});
