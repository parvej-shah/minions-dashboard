import { describe, expect, it } from "vitest";
import { autopilotAllowed, checkIsDue, linkedinHealth, linkedinNudge } from "./linkedinHealth";

const now = new Date("2026-11-20T09:00:00Z");
const days = (d: number) => new Date(now.getTime() + d * 86_400_000).toISOString();
const row = (config: unknown = null, over: object = {}) => ({ isActive: true, credentialRef: "ref", config, ...over });

describe("linkedinHealth", () => {
  it("is missing with no row, an inactive row or no credential", () => {
    expect(linkedinHealth(null, now)).toBe("missing");
    expect(linkedinHealth(row(null, { isActive: false }), now)).toBe("missing");
    expect(linkedinHealth(row(null, { credentialRef: null }), now)).toBe("missing");
  });
  it("is connected with a far expiry or none recorded", () => {
    expect(linkedinHealth(row({ expiresAt: days(40) }), now)).toBe("connected");
    expect(linkedinHealth(row(null), now)).toBe("connected");
  });
  it("is expiring under 7 days and expired once past", () => {
    expect(linkedinHealth(row({ expiresAt: days(6) }), now)).toBe("expiring");
    expect(linkedinHealth(row({ expiresAt: days(7.5) }), now)).toBe("connected");
    expect(linkedinHealth(row({ expiresAt: days(-1) }), now)).toBe("expired");
  });
  it("is expired when LinkedIn refused the token, whatever the expiry", () => {
    expect(linkedinHealth(row({ expiresAt: days(40), rejectedAt: days(-1) }), now)).toBe("expired");
  });
});

describe("what the health allows", () => {
  it("lets Autopilot run only on a working connection", () => {
    expect(["connected", "expiring"].every((h) => autopilotAllowed(h as never))).toBe(true);
    expect(autopilotAllowed("expired")).toBe(false);
    expect(autopilotAllowed("missing")).toBe(false);
  });
  it("shows Connect or Reconnect, and nothing when connected", () => {
    expect(linkedinNudge("missing")?.action).toBe("Connect LinkedIn");
    expect(linkedinNudge("expired")?.action).toBe("Reconnect LinkedIn");
    expect(linkedinNudge("expiring")?.action).toBe("Reconnect LinkedIn");
    expect(linkedinNudge("connected")).toBeNull();
  });
  it("checks live once a day", () => {
    expect(checkIsDue(row({ checkedAt: days(-0.5) }), now)).toBe(false);
    expect(checkIsDue(row({ checkedAt: days(-1.1) }), now)).toBe(true);
    expect(checkIsDue(row(null), now)).toBe(true);
    expect(checkIsDue(null, now)).toBe(false);
  });
});
