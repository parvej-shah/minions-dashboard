import { afterEach, describe, expect, it, vi } from "vitest";
import { r2KeyFromUrl } from "./r2";

describe("r2KeyFromUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns the key only for our own bucket's URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_R2_PUBLIC_DOMAIN", "https://cdn.example.com");
    expect(r2KeyFromUrl("https://cdn.example.com/covers/c1/a1-123.png")).toBe("covers/c1/a1-123.png");
    expect(r2KeyFromUrl("https://cdn.example.com.evil.io/covers/x.png")).toBeNull();
    expect(r2KeyFromUrl("https://other.com/covers/x.png")).toBeNull();
    expect(r2KeyFromUrl(null)).toBeNull();
  });
});
