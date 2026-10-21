import { describe, expect, it, vi } from "vitest";
import type { GeneratedDirective } from "@/lib/ai/brandCopilot";
import { INITIAL_FIELDS } from "./onboardingDraft";
import { saveWorkspace, withinCategoryLimit } from "./onboardingSubmit";

// Each call is logged when it starts and when it finishes, so the test can see what overlapped.
const log: string[] = [];
const call = (name: string) => async () => {
  log.push(`${name}:start`);
  await new Promise((resolve) => setTimeout(resolve, 5));
  log.push(`${name}:end`);
  return { success: true, examples_saved: 1 };
};
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    post: (url: string) => call(url === "/api/brand/directives" ? "directive" : url)(),
    patch: (url: string) => call(url)(),
  },
}));

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

describe("saveWorkspace", () => {
  it("saves rules side by side, the import after the voice sample, and the schedule last", async () => {
    log.length = 0;
    const brief = { positioning: "", directives: [rule("VOICE", 0), rule("VOICE", 1), rule("TOPICS", 0)] };
    await saveWorkspace(INITIAL_FIELDS, brief, "A sample I wrote about closing the books.", call("import"));

    const at = (entry: string) => log.indexOf(entry);
    expect(log[0]).toBe("/api/onboarding/setup:start");
    // The rules don't wait for each other.
    expect(log.filter((e) => e === "directive:start")).toHaveLength(3);
    expect(at("directive:start")).toBeLessThan(at("directive:end"));
    expect(log.slice(at("directive:start"), at("directive:start") + 3).every((e) => e === "directive:start" || e === "/api/onboarding/voice:start")).toBe(true);
    // The voice route resets the voice settings, so the import (which may set them) comes after it.
    expect(at("import:start")).toBeGreaterThan(at("/api/onboarding/voice:end"));
    // The schedule marks the workspace established and closes the voice and rule routes.
    expect(log.at(-2)).toBe("/api/schedule:start");
    expect(at("/api/schedule:start")).toBeGreaterThan(Math.max(at("import:end"), log.lastIndexOf("directive:end")));
  });
});
