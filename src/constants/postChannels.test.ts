import { describe, expect, it } from "vitest";
import { parsePostChannels, postGoesTo } from "./postChannels";

describe("one post's channels (D18)", () => {
  it("follows the workspace until a post names its own", () => {
    expect(postGoesTo([], "blog")).toBe(true);
    expect(postGoesTo(undefined, "linkedin")).toBe(true);
    expect(postGoesTo(["linkedin"], "blog")).toBe(false);
    expect(postGoesTo(["linkedin"], "linkedin")).toBe(true);
  });

  it("accepts only known channels, once each, in a fixed order", () => {
    expect(parsePostChannels(["linkedin", "blog", "linkedin"])).toEqual(["blog", "linkedin"]);
    expect(parsePostChannels(["x"])).toBeNull();
    expect(parsePostChannels("blog")).toBeNull();
  });
});
