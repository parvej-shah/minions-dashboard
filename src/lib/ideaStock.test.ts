import { describe, expect, it } from "vitest";
import { ideasToDiscard, type StockIdea } from "./ideaStock";

const idea = (id: string, day: number, own = false): StockIdea => ({ id, createdAt: new Date(2026, 9, day), memoryIds: own ? ["MEM-1"] : [] });

describe("ideasToDiscard", () => {
  it("discards nothing while the stock fits", () => {
    expect(ideasToDiscard([idea("a", 1), idea("b", 2)], 2)).toEqual([]);
    expect(ideasToDiscard([], 0)).toEqual([]);
  });

  it("drops outside ideas before the author's own, oldest first", () => {
    const stock = [idea("own-old", 1, true), idea("news-new", 5), idea("news-old", 2), idea("own-new", 6, true)];
    expect(ideasToDiscard(stock, 2)).toEqual(["news-old", "news-new"]);
    expect(ideasToDiscard(stock, 1)).toEqual(["news-old", "news-new", "own-old"]);
  });

  it("treats a negative keep as zero", () => {
    expect(ideasToDiscard([idea("a", 1)], -3)).toEqual(["a"]);
  });
});
