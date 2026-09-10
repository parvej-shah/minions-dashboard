import { describe, it, expect } from "vitest";
import { assertSafeFetchTarget } from "./ssrf-guard";
import { resolveSourceFeedUrl } from "@/constants/ideaSources";

/**
 * Idea sources are operator-supplied URLs that the harvester fetches
 * server-side, so they are a live SSRF surface. The /api/ideas/sources routes
 * run every create and every target-changing edit through
 * assertSafeFetchTarget for this reason.
 */
describe("idea source fetch targets", () => {
  it("blocks the cloud metadata endpoint", async () => {
    await expect(
      assertSafeFetchTarget("http://169.254.169.254/latest/meta-data/")
    ).rejects.toThrow();
  });

  it("blocks localhost and private ranges", async () => {
    await expect(assertSafeFetchTarget("http://localhost:3000/api/version")).rejects.toThrow();
    await expect(assertSafeFetchTarget("http://10.0.0.1/")).rejects.toThrow();
  });

  it("blocks non-http schemes", async () => {
    await expect(assertSafeFetchTarget("file:///etc/passwd")).rejects.toThrow();
  });

  it("composes a Google News feed from a typed topic", () => {
    expect(resolveSourceFeedUrl({ kind: "GOOGLE_NEWS", query: "commercial HVAC regulation" })).toContain(
      "commercial%20HVAC%20regulation"
    );
  });

  it("composes a subreddit feed, tolerating a leading r/", () => {
    expect(resolveSourceFeedUrl({ kind: "REDDIT", query: "r/msp" })).toContain("/r/msp/");
  });

  it("returns null when a query-driven source has no topic", () => {
    expect(resolveSourceFeedUrl({ kind: "GOOGLE_NEWS", query: "  " })).toBeNull();
  });
});
