import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by Postgres, not in-memory -- this app runs
 * as multiple serverless instances with no shared process memory, so an
 * in-memory counter would let each instance allow its own separate quota. A
 * DB upsert is correct regardless of instance count and cheap at the volumes
 * these gates see (one indexed upsert per checked request).
 *
 * `bucketKey` should be opaque (a hash, not a raw secret/token) since it's
 * persisted. Windows are truncated to `windowSeconds` and keyed by their
 * start time, so a bucket's count resets naturally once the window rolls over
 * -- no expiry/cleanup job needed for correctness (stale rows just accumulate;
 * fine at current volume).
 */
export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);

  const hit = await prisma.rateLimitHit.upsert({
    where: { bucketKey_windowStart: { bucketKey, windowStart } },
    update: { count: { increment: 1 } },
    create: { bucketKey, windowStart, count: 1 },
  });

  return { allowed: hit.count <= limit, remaining: Math.max(0, limit - hit.count) };
}
