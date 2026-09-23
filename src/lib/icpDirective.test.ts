import { describe, expect, it } from "vitest";
import { renderIcpDirective } from "./icpDirective";
import { EMPTY_ICP } from "@/services/authorContext";

describe("the AUDIENCE directive derived from the ICP", () => {
  it("renders every filled field in one instruction", () => {
    const text = renderIcpDirective({
      ...EMPTY_ICP,
      who: "Owners of roofing firms.",
      role: "Owner-operator",
      pains: ["Missed calls", "No-shows"],
      questions: ["Will callers hang up on an AI?"],
    });
    expect(text).toBe(
      "Owners of roofing firms. Role: Owner-operator. Their pains: Missed calls; No-shows. Questions they ask: Will callers hang up on an AI?."
    );
  });

  it("is empty for an empty profile, so the directive is switched off rather than blank", () => {
    expect(renderIcpDirective(EMPTY_ICP)).toBe("");
  });
});
