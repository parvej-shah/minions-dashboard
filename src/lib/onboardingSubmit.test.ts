import { describe, expect, it } from "vitest";
import type { GeneratedDirective } from "@/lib/ai/brandCopilot";
import { withinCategoryLimit } from "./onboardingSubmit";

const rule = (category: GeneratedDirective["category"], n: number): GeneratedDirective => ({ category, rule_key: `${category}_${n}`, instruction: "x", priority: 1 });

describe("withinCategoryLimit", () => {
  it("keeps five rules per category and every forbidden word", () => {
    const rules = [
      ...Array.from({ length: 8 }, (_, i) => rule("VOICE", i)),
      ...Array.from({ length: 8 }, (_, i) => rule("FORBIDDEN", i)),
      rule("TOPICS", 0),
    ];
    const kept = withinCategoryLimit(rules);
    expect(kept.filter((r) => r.category === "VOICE")).toHaveLength(5);
    expect(kept.filter((r) => r.category === "FORBIDDEN")).toHaveLength(8);
    expect(kept.filter((r) => r.category === "TOPICS")).toHaveLength(1);
  });
});
