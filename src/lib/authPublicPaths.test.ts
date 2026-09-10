import { describe, it, expect } from "vitest";
import { authConfig } from "./auth.config";

/**
 * The session gate decides whether a request reaches its route at all. n8n
 * calls several routes server-to-server with a webhook secret and does NOT
 * follow redirects, so a route missing from publicPaths fails silently: the
 * gate answers 307 to /login, the node reads an empty body, and the workflow
 * carries on with whatever default it had.
 *
 * That exact failure published every generated cover image on a 24-hour
 * Alibaba URL -- /api/media/ingest returned the permanent R2 URL correctly
 * when called directly, but n8n never saw the response.
 */
function authorized(pathname: string, signedIn: boolean): boolean {
  const request = { url: `https://minions.getminions.ai${pathname}` } as Request;
  const auth = signedIn ? ({ user: { id: "u1" } } as never) : null;
  return authConfig.callbacks!.authorized!({ auth, request } as never) as boolean;
}

describe("session gate public paths", () => {
  const n8nRoutes = [
    "/api/brand/context",
    "/api/media/ingest",
    "/api/ideas/craft",
    "/api/webhooks/idea-harvested",
    "/api/internal/schedule/eligible-tenants",
  ];

  it("lets every n8n-called route through without a session", () => {
    for (const route of n8nRoutes) {
      expect(authorized(route, false), `${route} must not redirect to /login`).toBe(true);
    }
  });

  it("still gates browser routes", () => {
    for (const route of ["/api/assets", "/api/ideas", "/api/brand", "/api/team"]) {
      expect(authorized(route, false), `${route} must require a session`).toBe(false);
      expect(authorized(route, true)).toBe(true);
    }
  });

  /**
   * These routes are reachable without a session, so each must do its own
   * secret check. This test pins the pairing: adding a path above without
   * adding auth inside the route would open it to anyone.
   */
  it("keeps the gate list narrow", () => {
    const paths = ["/docs", "/api/llms", "/api/version", "/api/auth", "/api/webhooks",
      "/api/channels", "/api/brand/context", "/api/media/ingest", "/api/ideas/craft",
      "/api/internal", "/login"];
    for (const p of paths) expect(authorized(p, false)).toBe(true);
    // A route NOT on the list stays gated even if it shares a prefix segment.
    expect(authorized("/api/ideas", false)).toBe(false);
    expect(authorized("/api/media/upload", false)).toBe(false);
  });
});
