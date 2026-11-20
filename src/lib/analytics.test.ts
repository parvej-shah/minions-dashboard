import { afterEach, describe, expect, it, vi } from "vitest";
import { track } from "./analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("track", () => {
  it("sends the event to gtag when it exists", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    track("post_approved", { method: "scheduled" });
    expect(gtag).toHaveBeenCalledWith("event", "post_approved", { method: "scheduled" });
  });

  it("does nothing when there is no window (server) or no gtag", () => {
    expect(() => track("app_installed")).not.toThrow();
    vi.stubGlobal("window", {});
    expect(() => track("app_installed")).not.toThrow();
  });

  it("never throws when gtag does", () => {
    vi.stubGlobal("window", { gtag: () => { throw new Error("blocked"); } });
    expect(() => track("app_installed")).not.toThrow();
  });
});
