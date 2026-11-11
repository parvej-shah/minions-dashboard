import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const globalsCss = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
const editorialStudioTsx = readFileSync(path.join(root, "src/components/editorial/EditorialStudio.tsx"), "utf8");
const carouselCardTsx = readFileSync(path.join(root, "src/components/editorial/CarouselCard.tsx"), "utf8");
const socialVariantTabsTsx = readFileSync(path.join(root, "src/components/editorial/social/SocialVariantTabs.tsx"), "utf8");

describe("Global Scrollbar CSS Configuration (src/app/globals.css)", () => {
  it("hides desktop window edge scrollbars via standard CSS scrollbar-width: none on root scrollers", () => {
    // :root, html, body must configure scrollbar-width: none to eliminate the right-edge window scrollbar
    expect(globalsCss).toMatch(/(?::root|html|body)[^{]*\{[^}]*scrollbar-width:\s*none/);
    expect(globalsCss).toMatch(/(?::root|html|body)[^{]*\{[^}]*-ms-overflow-style:\s*none/);
  });

  it("suppresses WebKit scrollbars completely with display: none and zero dimensions", () => {
    // ::-webkit-scrollbar must be hidden with display: none
    expect(globalsCss).toMatch(/::-webkit-scrollbar\s*\{[^}]*display:\s*none/);
    expect(globalsCss).toMatch(/::-webkit-scrollbar-track\s*\{[^}]*background:\s*transparent/);
    // Must NOT have background: var(--bg) on track which creates opaque gutters
    expect(globalsCss).not.toMatch(/::-webkit-scrollbar-track\s*\{[^}]*background:\s*var\(--bg\)/);
  });

  it("suppresses native OS stepper arrow buttons", () => {
    expect(globalsCss).toMatch(/::-webkit-scrollbar-button\s*\{[^}]*display:\s*none/);
  });

  it("declares @utility scrollbar-none in Tailwind v4", () => {
    expect(globalsCss).toContain("@utility scrollbar-none");
    const utilityBlock = globalsCss.slice(globalsCss.indexOf("@utility scrollbar-none"));
    expect(utilityBlock).toMatch(/scrollbar-width:\s*none/);
  });

  it("declares @utility scrollbar-subtle in Tailwind v4", () => {
    expect(globalsCss).toContain("@utility scrollbar-subtle");
  });
});

describe("Editorial Studio Review Column (src/components/editorial/EditorialStudio.tsx)", () => {
  it("eliminates the buggy lg:[scrollbar-width:thin] class", () => {
    expect(editorialStudioTsx).not.toContain("lg:[scrollbar-width:thin]");
    expect(editorialStudioTsx).not.toContain("[scrollbar-width:thin]");
  });

  it("applies scrollbar-none to the editorial publishing options aside while preserving overflow-y-auto", () => {
    const asideMatch = editorialStudioTsx.match(/<aside[\s\S]*?id="editorial-publishing-options"[\s\S]*?>/);
    expect(asideMatch).toBeTruthy();
    const asideTag = asideMatch![0];
    expect(asideTag).toContain("scrollbar-none");
    expect(asideTag).toContain("lg:overflow-y-auto");
  });
});

describe("Carousel Preview Containers (CarouselCard.tsx & SocialVariantTabs.tsx)", () => {
  it("applies scrollbar-none to the slide preview ribbon in CarouselCard.tsx", () => {
    const cardMatch = carouselCardTsx.match(/overflow-x-auto\s+snap-x[^"'>]*/);
    expect(cardMatch).toBeTruthy();
    expect(cardMatch![0]).toContain("scrollbar-none");
  });

  it("applies scrollbar-none to the deck preview ribbon in SocialVariantTabs.tsx", () => {
    const deckMatch = socialVariantTabsTsx.match(/overflow-x-auto\s+snap-x[^"'>]*/);
    expect(deckMatch).toBeTruthy();
    expect(deckMatch![0]).toContain("scrollbar-none");
  });
});

describe("Scrollability Invariants", () => {
  it("does not disable scrolling with overflow: hidden on html or body", () => {
    expect(globalsCss).not.toMatch(/(?:html|body)[^{]*\{[^}]*overflow:\s*hidden/);
  });
});
