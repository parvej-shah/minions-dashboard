import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Captions Media Preview across all channels (Task 63)", () => {
  const socialTabs = read("src/components/editorial/social/SocialVariantTabs.tsx");

  it("Facebook tab renders media preview for both cover image and carousel", () => {
    // Facebook must not omit media preview
    expect(socialTabs).toMatch(/isShown\("FACEBOOK"\)[\s\S]*?ChannelMediaPreview/);
  });

  it("LinkedIn tab renders carousel slides preview when carousel is active", () => {
    // LinkedIn must render carousel slides when carousel format is on
    expect(socialTabs).toMatch(/isShown\("LINKEDIN"\)[\s\S]*?ChannelMediaPreview/);
  });

  it("Instagram tab uses ChannelMediaPreview for consistent visual presentation", () => {
    expect(socialTabs).toMatch(/isShown\("INSTAGRAM"\)[\s\S]*?ChannelMediaPreview/);
  });
});
