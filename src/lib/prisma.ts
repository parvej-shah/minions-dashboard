import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireOneOfEnv } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requireOneOfEnv("DATABASE_URL", "DIRECT_URL"),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;

  const client = createPrismaClient();
  // Reused in development so hot reload does not open a new pool per edit, and
  // in production so the lazy proxy below builds the client only once.
  globalForPrisma.prisma = client;
  return client;
}

/**
 * The Prisma client, constructed on first use rather than on import.
 *
 * `next build` evaluates every route module to collect page data, so an eager
 * client made DATABASE_URL a *build-time* requirement — and the CI workflow only
 * supplies runtime secrets, so the build failed at `/api/assets/[id]`. Nothing
 * about compiling the app needs a live database; only a request does. The proxy
 * defers construction to the first property access, which is always inside a
 * handler.
 *
 * `requireOneOfEnv` still throws on a missing variable — just at the first
 * query, where it is a real misconfiguration, instead of during a build.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, property) {
    return Reflect.has(getPrismaClient(), property);
  },
});
