import { describe, expect, it } from "vitest";
import { nextPending, queueFor, stepWithin } from "./queue";

const a = (id: string, status: string) => ({ id, status }) as { id: string; status: "PENDING_REVIEW" | "PUBLISHED" };
const ALL = [a("1", "PENDING_REVIEW"), a("2", "PUBLISHED"), a("3", "PENDING_REVIEW"), a("4", "PENDING_REVIEW")];

describe("review queue", () => {
  it("filters by status, ALL shows everything", () => {
    expect(queueFor(ALL, "PENDING_REVIEW").map((x) => x.id)).toEqual(["1", "3", "4"]);
    expect(queueFor(ALL, "ALL")).toHaveLength(4);
  });

  it("steps inside the filter and wraps", () => {
    const pending = queueFor(ALL, "PENDING_REVIEW");
    expect(stepWithin(pending, ALL, "1", 1)?.id).toBe("3");
    expect(stepWithin(pending, ALL, "4", 1)?.id).toBe("1");
    expect(stepWithin(pending, ALL, "1", -1)?.id).toBe("4");
  });

  it("steps from a draft that just left the filter to the one in its place", () => {
    const pending = queueFor(ALL, "PENDING_REVIEW");
    expect(stepWithin(pending, ALL, "2", 1)?.id).toBe("3");
    expect(stepWithin(pending, ALL, "2", -1)?.id).toBe("1");
  });

  it("offers the next pending draft, never the current one", () => {
    const published = ALL.map((x) => (x.id === "3" ? a("3", "PUBLISHED") : x));
    expect(nextPending(published, "3")?.id).toBe("4");
    expect(nextPending([a("1", "PENDING_REVIEW")], "1")).toBeNull();
    expect(nextPending([a("1", "PUBLISHED")], "1")).toBeNull();
  });
});
