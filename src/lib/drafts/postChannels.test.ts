import { describe, expect, it } from "vitest";
import { toggleChannel } from "./postChannels";

describe("toggleChannel", () => {
  const offered = ["blog", "linkedin", "facebook"] as const;

  it("turns one off and keeps the workspace order", () => {
    expect(toggleChannel([...offered], [...offered], "linkedin")).toEqual({ channels: ["blog", "facebook"] });
  });

  it("returns null (follow the workspace) once every offered channel is on again", () => {
    expect(toggleChannel([...offered], ["facebook", "blog"], "linkedin")).toEqual({ channels: null });
  });

  it("refuses to turn off the last channel", () => {
    expect(toggleChannel([...offered], ["blog"], "blog")).toEqual({ refused: true });
  });
});
