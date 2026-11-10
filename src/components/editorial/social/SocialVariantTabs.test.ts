import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AssetItem } from "@/types";
import SocialVariantTabs from "./SocialVariantTabs";

const noop = () => {};
const asset = {
  id: "a1", title: "Why demos fail", hero_image_url: "https://cdn/covers/a1.png", hero_status: "READY",
  variants: { linkedin: "", facebook: "", twitter: "", instagram: "Voice AI demos lie. #voiceai #realestate #proptech" },
  cover: null, carousel_pages: null,
} as unknown as AssetItem;

const render = (a: AssetItem) =>
  renderToStaticMarkup(
    h(SocialVariantTabs, {
      activeAsset: a, socialTab: "INSTAGRAM", setSocialTab: noop, isEditingSocial: false, isSaving: false, setIsEditingSocial: noop,
      edited: { linkedin: "", facebook: "", twitter: "", instagram: a.variants.instagram ?? "" } as never,
      setEditedLinkedin: noop, setEditedFacebook: noop, setEditedTwitter: noop, setEditedInstagram: noop,
      onSave: noop, onCopy: noop, copiedKey: null,
      enabledTabs: { LINKEDIN: false, FACEBOOK: false, INSTAGRAM: true, TWITTER: false },
    }),
  );

describe("the Instagram tab", () => {
  it("shows the cover when there is no carousel", () => {
    const html = render(asset);
    expect(html).toContain("post it with the cover image");
    expect(html).not.toContain("Page 1 of");
  });

  it("shows every carousel page, cover first, when the carousel is on", () => {
    const pages = ["https://cdn/carousels/c1/a1-1/01.jpg", "https://cdn/carousels/c1/a1-1/02.jpg", "https://cdn/carousels/c1/a1-1/03.jpg"];
    const html = render({ ...asset, carousel_pages: pages });
    expect(html).toContain("post these 3 pages as a carousel");
    expect(html.indexOf("01.jpg")).toBeLessThan(html.indexOf("03.jpg"));
    expect(html).toContain("Page 3 of 3");
    expect(html).not.toContain("covers/a1.png");
  });
});
