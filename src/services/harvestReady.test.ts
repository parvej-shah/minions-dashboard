import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { brandProfile: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));
import { isHarvestReady } from "./harvestReady";

describe("isHarvestReady", () => {
  beforeEach(() => findUnique.mockReset());
  it("false with no brand profile", async () => {
    findUnique.mockResolvedValue(null);
    expect(await isHarvestReady("c")).toBe(false);
  });
  it("false with blank positioning", async () => {
    findUnique.mockResolvedValue({ positioning: "  " });
    expect(await isHarvestReady("c")).toBe(false);
  });
  it("true with positioning", async () => {
    findUnique.mockResolvedValue({ positioning: "I help X" });
    expect(await isHarvestReady("c")).toBe(true);
  });
});
