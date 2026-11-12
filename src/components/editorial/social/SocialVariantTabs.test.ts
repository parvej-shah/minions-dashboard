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

const render = (a: AssetItem, extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(SocialVariantTabs, {
      activeAsset: a, socialTab: "INSTAGRAM", setSocialTab: noop, isEditingSocial: false, isSaving: false, setIsEditingSocial: noop,
      edited: { linkedin: "", facebook: "", twitter: "", instagram: a.variants.instagram ?? "" } as never,
      setEditedLinkedin: noop, setEditedFacebook: noop, setEditedTwitter: noop, setEditedInstagram: noop,
      onSave: noop, onCopy: noop, copiedKey: null,
      enabledTabs: { LINKEDIN: false, FACEBOOK: false, INSTAGRAM: true, TWITTER: false },
      ...extra,
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
    expect(html).toContain("Post these 3 pages as one Instagram carousel");
    expect(html.indexOf("01.jpg")).toBeLessThan(html.indexOf("03.jpg"));
    expect(html).toContain("Page 3 of 3");
    expect(html).not.toContain("covers/a1.png");
  });

  const pages = ["https://cdn/carousels/c1/a1-1/01.jpg", "https://cdn/carousels/c1/a1-1/02.jpg"];

  it("shows single poster preview when instagramFormat is SINGLE", () => {
    const html = render({ ...asset, carousel_pages: pages }, { instagramFormat: "SINGLE" });
    // The preview follows the unified choice: the poster, not the pages.
    expect(html).not.toContain("Page 1 of");
    expect(html).toContain("covers/a1.png");
    // Duplicate segmented picker is removed
    expect(html).not.toContain("Post on Instagram");
  });

  it("offers no duplicate format picker on the Instagram tab", () => {
    const html = render({ ...asset, carousel_pages: pages }, { instagramFormat: "CAROUSEL" });
    expect(html).not.toContain("Post on Instagram");
  });
});

describe("the LinkedIn tab", () => {
  it("shows Edit post button even when carousel is active", () => {
    const html = renderToStaticMarkup(
      h(SocialVariantTabs, {
        activeAsset: asset,
        socialTab: "LINKEDIN",
        setSocialTab: noop,
        isEditingSocial: false,
        isSaving: false,
        setIsEditingSocial: noop,
        edited: { linkedin: "Post copy", facebook: "", twitter: "", instagram: "" } as never,
        setEditedLinkedin: noop,
        setEditedFacebook: noop,
        setEditedTwitter: noop,
        setEditedInstagram: noop,
        onSave: noop,
        onCopy: noop,
        copiedKey: null,
        enabledTabs: { LINKEDIN: true, FACEBOOK: false, INSTAGRAM: false, TWITTER: false },
        linkedinCarousel: { caption: "Carousel caption", pages: ["https://cdn/01.jpg"] },
      })
    );
    expect(html).toContain("Edit post");
  });
});
