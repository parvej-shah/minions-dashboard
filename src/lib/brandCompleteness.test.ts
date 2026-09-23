import { describe, expect, it } from "vitest";
import { computeCompleteness, MEMORY_TARGET } from "./brandCompleteness";
import type { MemoryKind } from "@/constants/contentLanes";

const empty = { icp: { who: "", pains: [], decisions: [], questions: [] }, memoryKinds: [] as MemoryKind[], hasPositioning: false, toneExamples: 0, approvedProofs: 0 };

describe("brand completeness", () => {
  it("an empty profile scores 0 and asks for the ICP and first experience first", () => {
    const r = computeCompleteness(empty);
    expect(r.score).toBe(0);
    expect(r.prompts.map((p) => p.id)).toEqual(["icp-who", "memory-first", "icp-pains"]);
    expect(r.prompts.length).toBeLessThanOrEqual(3);
  });

  it("a full profile scores 100 with nothing left to ask", () => {
    const kinds: MemoryKind[] = ["CURRENT_WORK", "LESSON", "STORY", "OPINION", "ICP_QUESTION", "PAST_EXPERIENCE", "EXPERIMENT", "LESSON", "STORY", "CURRENT_WORK"];
    const r = computeCompleteness({
      icp: { who: "Owners of roofing firms with 5 to 30 staff", pains: ["missed calls"], decisions: ["hire or automate"], questions: [] },
      memoryKinds: kinds,
      hasPositioning: true,
      toneExamples: 2,
      approvedProofs: 1,
    });
    expect(kinds.length).toBe(MEMORY_TARGET);
    expect(r).toEqual({ score: 100, prompts: [] });
  });

  it("counts toward the memory target and says how many there are", () => {
    const r = computeCompleteness({ ...empty, icp: { who: "Owners of roofing firms with 5 to 30 staff", pains: ["x"], decisions: ["y"], questions: [] }, memoryKinds: ["LESSON", "CURRENT_WORK", "STORY"], toneExamples: 1 });
    const ten = r.prompts.find((p) => p.id === "memory-ten");
    expect(ten?.text).toContain("You have 3");
  });
});
