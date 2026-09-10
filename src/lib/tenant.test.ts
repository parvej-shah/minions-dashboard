import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUniqueMock = vi.fn();
const clientFindUniqueMock = vi.fn();
const cookiesGetMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    client: { findUnique: clientFindUniqueMock },
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGetMock }),
}));

const { requireClientId, isPlatformStaff } = await import("./tenant");

function dbUser(overrides: Partial<{ id: string; email: string; clientId: string | null; role: string }> = {}) {
  return { id: "user-1", email: "a@example.com", clientId: "client-1", role: "MEMBER", ...overrides };
}

beforeEach(() => {
  authMock.mockReset();
  findUniqueMock.mockReset();
  clientFindUniqueMock.mockReset();
  cookiesGetMock.mockReset();
});

describe("isPlatformStaff", () => {
  it("is true for a no-tenant SYSTEM_ADMIN", () => {
    expect(isPlatformStaff({ clientId: null, role: "SYSTEM_ADMIN" })).toBe(true);
  });

  it("is true for a SYSTEM_ADMIN attached to a tenant", () => {
    expect(isPlatformStaff({ clientId: "client-1", role: "SYSTEM_ADMIN" })).toBe(true);
  });

  it("is false for a no-tenant non-admin", () => {
    expect(isPlatformStaff({ clientId: null, role: "MEMBER" })).toBe(false);
  });
});

describe("requireClientId", () => {
  it("401s when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const result = await requireClientId();
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(401);
  });

  it("401s when the session user no longer exists in the DB", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findUniqueMock.mockResolvedValue(null);
    const result = await requireClientId();
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(401);
  });

  it("resolves a regular tenant user's own clientId", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    findUniqueMock.mockResolvedValue(dbUser({ clientId: "client-1" }));
    const result = await requireClientId();
    expect("clientId" in result && result.clientId).toBe("client-1");
  });

  it("403s platform staff with no tenant and no active impersonation session", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1" } });
    findUniqueMock.mockResolvedValue(dbUser({ id: "admin-1", clientId: null, role: "SYSTEM_ADMIN" }));
    cookiesGetMock.mockReturnValue(undefined);
    const result = await requireClientId();
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("resolves the impersonated clientId for platform staff mid-view-as-tenant", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1" } });
    findUniqueMock.mockResolvedValue(dbUser({ id: "admin-1", clientId: null, role: "SYSTEM_ADMIN" }));
    cookiesGetMock.mockReturnValue({ value: "client-9" });
    clientFindUniqueMock.mockResolvedValue({ id: "client-9" });
    const result = await requireClientId();
    expect("clientId" in result && result.clientId).toBe("client-9");
  });

  it("403s a user attached to no tenant who isn't platform staff", async () => {
    authMock.mockResolvedValue({ user: { id: "user-2" } });
    findUniqueMock.mockResolvedValue(dbUser({ id: "user-2", clientId: null, role: "MEMBER" }));
    const result = await requireClientId();
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });
});
