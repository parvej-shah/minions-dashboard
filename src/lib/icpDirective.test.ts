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
      "Owners of roofing firms. Role: Owner-operator. Their pains: Missed calls; No-shows. Questions they ask: Will callers hang up on an AI?. They buy the outcome, not the technology: lead with what changes for them and keep how it works to one plain sentence."
    );
  });

  it("says a technical buyer wants to know how it works", () => {
    expect(renderIcpDirective({ ...EMPTY_ICP, who: "Platform engineers.", buyer: "TECHNICAL" })).toBe(
      "Platform engineers. They are technical buyers: they want to know how it works, so technical depth is welcome."
    );
  });

  it("is empty for an empty profile, so the directive is switched off rather than blank", () => {
    expect(renderIcpDirective(EMPTY_ICP)).toBe("");
  });
});

describe("parseIcpInput buyer", () => {
  it("keeps OUTCOME or TECHNICAL and treats anything else as OUTCOME", async () => {
    const { parseIcpInput } = await import("./authorInput");
    const buyer = (v: unknown) => (parseIcpInput({ buyer: v }) as { buyer: string }).buyer;
    expect(buyer("TECHNICAL")).toBe("TECHNICAL");
    expect(buyer("OUTCOME")).toBe("OUTCOME");
    expect(buyer("nonsense")).toBe("OUTCOME");
    expect(buyer(undefined)).toBe("OUTCOME");
  });
});
