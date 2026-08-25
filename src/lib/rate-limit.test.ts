import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory fake standing in for prisma.rateLimitHit -- exercises checkRateLimit's
// actual window-bucketing/increment logic without needing a real Postgres instance.
const rows = new Map<string, { bucketKey: string; windowStart: Date; count: number }>();

function keyFor(bucketKey: string, windowStart: Date) {
  return `${bucketKey}::${windowStart.toISOString()}`;
}

const upsertMock = vi.fn(
  async ({
    where,
    update,
    create,
  }: {
    where: { bucketKey_windowStart: { bucketKey: string; windowStart: Date } };
    update: { count: { increment: number } };
    create: { bucketKey: string; windowStart: Date; count: number };
  }) => {
    const { bucketKey, windowStart } = where.bucketKey_windowStart;
    const k = keyFor(bucketKey, windowStart);
    const existing = rows.get(k);
    const row = existing
      ? { ...existing, count: existing.count + update.count.increment }
      : { bucketKey, windowStart, count: create.count };
    rows.set(k, row);
    return row;
  }
);

vi.mock("@/lib/prisma", () => ({ prisma: { rateLimitHit: { upsert: upsertMock } } }));

const { checkRateLimit } = await import("./rate-limit");

beforeEach(() => {
  rows.clear();
  upsertMock.mockClear();
});

describe("checkRateLimit", () => {
  it("allows requests under the limit and reports remaining budget", async () => {
    const first = await checkRateLimit("bucket-a", 3, 60);
    expect(first).toEqual({ allowed: true, remaining: 2 });

    const second = await checkRateLimit("bucket-a", 3, 60);
    expect(second).toEqual({ allowed: true, remaining: 1 });
  });

  it("trips once the count exceeds the limit", async () => {
    await checkRateLimit("bucket-b", 2, 60);
    await checkRateLimit("bucket-b", 2, 60);
    const third = await checkRateLimit("bucket-b", 2, 60);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("keeps separate buckets independent", async () => {
    await checkRateLimit("bucket-c", 1, 60);
    const otherBucket = await checkRateLimit("bucket-d", 1, 60);
    expect(otherBucket.allowed).toBe(true);
  });

  it("does not let remaining go negative", async () => {
    await checkRateLimit("bucket-e", 1, 60);
    await checkRateLimit("bucket-e", 1, 60);
    const third = await checkRateLimit("bucket-e", 1, 60);
    expect(third.remaining).toBe(0);
  });
});
