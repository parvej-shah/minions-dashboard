import { describe, expect, it } from "vitest";
import { MEMORY_KINDS } from "@/constants/contentLanes";
import { bankLevel, FULL_AT, LOW_AT, pickPrompts, previousWeek, promptById, SESSION_SIZE, STORY_PROMPTS, streakWeeks } from "./storyBank";

describe("bankLevel", () => {
  it("counts items no recent idea is built on", () => {
    const b = bankLevel(["a", "b", "c", "d"], [["a"], [], ["b", "a"]]);
    expect(b).toMatchObject({ unused: 2, total: 4, low: LOW_AT > 2 });
  });

  it("is low below one harvest's worth and full at FULL_AT", () => {
    expect(bankLevel([], []).low).toBe(true);
    const ids = Array.from({ length: FULL_AT + 3 }, (_, i) => `m${i}`);
    expect(bankLevel(ids, [])).toMatchObject({ low: false, level: 1 });
    expect(bankLevel(ids.slice(0, LOW_AT), []).low).toBe(false);
    expect(bankLevel(ids.slice(0, LOW_AT - 1), []).low).toBe(true);
  });
});

describe("pickPrompts", () => {
  it("asks about the kinds the author has fewest of, one question each", () => {
    const counts = { STORY: 5, LESSON: 4, OPINION: 3, ICP_QUESTION: 0, CURRENT_WORK: 2, EXPERIMENT: 0, PAST_EXPERIENCE: 1 };
    const kinds = pickPrompts(counts, 0).map((p) => p.kind);
    expect(kinds).toHaveLength(SESSION_SIZE);
    expect(new Set(kinds).size).toBe(SESSION_SIZE);
    expect(kinds).toEqual(expect.arrayContaining(["ICP_QUESTION", "EXPERIMENT", "PAST_EXPERIENCE"]));
  });

  it("is stable for a day and changes over days", () => {
    expect(pickPrompts({}, 20000)).toEqual(pickPrompts({}, 20000));
    const days = new Set(Array.from({ length: 7 }, (_, d) => pickPrompts({}, 20000 + d).map((p) => p.id).join()));
    expect(days.size).toBeGreaterThan(1);
  });

  it("only uses known kinds and ids", () => {
    for (const p of STORY_PROMPTS) {
      expect(MEMORY_KINDS).toContain(p.kind);
      expect(promptById(p.id)).toBe(p);
    }
    expect(new Set(STORY_PROMPTS.map((p) => p.id)).size).toBe(STORY_PROMPTS.length);
    expect(promptById("nope")).toBeUndefined();
  });
});

describe("streakWeeks", () => {
  it("steps back one Monday", () => {
    expect(previousWeek("2026-09-28")).toBe("2026-09-21");
    expect(previousWeek("2026-03-02")).toBe("2026-02-23");
  });

  it("counts consecutive weeks ending this week", () => {
    expect(streakWeeks(new Set(["2026-09-28", "2026-09-21", "2026-09-14", "2026-08-31"]), "2026-09-28")).toBe(3);
  });

  it("keeps last week's streak alive until this week ends", () => {
    expect(streakWeeks(new Set(["2026-09-21", "2026-09-14"]), "2026-09-28")).toBe(2);
  });

  it("is zero after a missed week", () => {
    expect(streakWeeks(new Set(["2026-09-14"]), "2026-09-28")).toBe(0);
  });
});
