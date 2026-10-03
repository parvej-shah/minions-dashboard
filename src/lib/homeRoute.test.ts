import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

const isEstablishedTenant = vi.fn();
vi.mock("@/services/onboardingGuard", () => ({ isEstablishedTenant }));

const { homeRouteFor } = await import("./homeRoute");

function session(user: Partial<Session["user"]>): Session {
  return { user: { id: "u", clientId: null, role: "MEMBER", ...user }, expires: "" } as Session;
}

beforeEach(() => vi.clearAllMocks());

describe("homeRouteFor", () => {
  it("sends a signed-out visitor to sign in", async () => {
    expect(await homeRouteFor(null)).toBe("/login");
  });

  it("sends a set-up workspace straight to the dashboard, never a chooser", async () => {
    isEstablishedTenant.mockResolvedValue(true);
    expect(await homeRouteFor(session({ clientId: "c" }))).toBe("/");
  });

  it("sends a workspace still mid-setup back to the wizard", async () => {
    isEstablishedTenant.mockResolvedValue(false);
    expect(await homeRouteFor(session({ clientId: "c" }))).toBe("/onboarding/setup");
  });

  it("sends a new signup with no workspace to the wizard without a lookup", async () => {
    expect(await homeRouteFor(session({}))).toBe("/onboarding/setup");
    expect(isEstablishedTenant).not.toHaveBeenCalled();
  });

  it("sends staff with no workspace to platform admin", async () => {
    expect(await homeRouteFor(session({ role: "SYSTEM_ADMIN" }))).toBe("/platform-admin");
  });
});
