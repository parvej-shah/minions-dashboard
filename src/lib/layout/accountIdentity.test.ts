import { describe, expect, it } from "vitest";
import { resolveAccountIdentity } from "./accountIdentity";

describe("resolveAccountIdentity", () => {
  it("prefers brand photo and brand name when both are configured", () => {
    const session = { name: "Google Name", email: "user@test.com", image: "https://google.com/pic.jpg" };
    const brand = { brand_name: "Minions Agency", primary_logo_url: "https://brand.com/logo.png" };

    const result = resolveAccountIdentity(session, brand);
    expect(result.avatarUrl).toBe("https://brand.com/logo.png");
    expect(result.displayName).toBe("Minions Agency");
    expect(result.initial).toBe("M");
  });

  it("falls back to session image and name when brand settings are empty or missing", () => {
    const session = { name: "Google Name", email: "user@test.com", image: "https://google.com/pic.jpg" };
    const emptyBrand = { brand_name: "", primary_logo_url: "" };

    const result1 = resolveAccountIdentity(session, emptyBrand);
    expect(result1.avatarUrl).toBe("https://google.com/pic.jpg");
    expect(result1.displayName).toBe("Google Name");
    expect(result1.initial).toBe("G");

    const result2 = resolveAccountIdentity(session, null);
    expect(result2.avatarUrl).toBe("https://google.com/pic.jpg");
    expect(result2.displayName).toBe("Google Name");
  });

  it("falls back to email when name is not provided", () => {
    const session = { name: null, email: "founder@domain.com", image: null };
    const result = resolveAccountIdentity(session, null);
    expect(result.avatarUrl).toBeNull();
    expect(result.displayName).toBe("founder@domain.com");
    expect(result.initial).toBe("F");
  });

  it("handles null session and null brand gracefully", () => {
    const result = resolveAccountIdentity(null, null);
    expect(result.avatarUrl).toBeNull();
    expect(result.displayName).toBe("Account");
    expect(result.initial).toBe("A");
  });
});
