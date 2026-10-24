import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const { setupPositioning } = await import("./onboardingSetup");

const AUDIENCE = "Real estate team leaders who lose commissions to missed calls.";

describe("setupPositioning", () => {
  it("saves what the writer does, not who reads them", () => {
    expect(setupPositioning({ positioning: "Founder building AI voice agents for brokerages.", content_focus: "Voice AI" }, AUDIENCE)).toBe(
      "Founder building AI voice agents for brokerages."
    );
    expect(setupPositioning({ positioning: "", content_focus: "I help brokerages answer every lead." }, AUDIENCE)).toBe(
      "I help brokerages answer every lead."
    );
  });

  it("falls back to the audience only when nothing else was given", () => {
    expect(setupPositioning({}, AUDIENCE)).toBe(AUDIENCE);
  });
});
