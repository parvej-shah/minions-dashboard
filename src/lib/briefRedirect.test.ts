import { describe, expect, it } from "vitest";
import { shouldSendToBrief } from "./briefRedirect";

const base = { brandLoading: false, hasSettings: true, positioning: "", pathname: "/", role: "OWNER" };

describe("shouldSendToBrief", () => {
  it("sends a tenant with no positioning from home", () => expect(shouldSendToBrief(base)).toBe(true));
  it("never sends staff viewing a tenant", () => expect(shouldSendToBrief({ ...base, role: "SYSTEM_ADMIN" })).toBe(false));
  it("only from the home page", () => expect(shouldSendToBrief({ ...base, pathname: "/posts" })).toBe(false));
  it("not once positioning exists, or while loading", () => {
    expect(shouldSendToBrief({ ...base, positioning: "x" })).toBe(false);
    expect(shouldSendToBrief({ ...base, brandLoading: true })).toBe(false);
    expect(shouldSendToBrief({ ...base, hasSettings: false })).toBe(false);
  });
});
