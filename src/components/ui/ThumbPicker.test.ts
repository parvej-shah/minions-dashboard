import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ThumbPicker from "./ThumbPicker";
import Segmented from "./Segmented";

const options = [
  { id: "BOLD", label: "Bold", src: "/images/pickers/cover-bold.webp" },
  { id: "SWISS", label: "Swiss", src: "/images/pickers/cover-swiss.webp" },
];

describe("ThumbPicker", () => {
  it("is a named radiogroup of pictured tiles, only the chosen one checked", () => {
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options, selected: "SWISS", onSelect: () => {} }));
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Layout"');
    expect(html.match(/role="radio"/g)).toHaveLength(2);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-checked="true"[^>]*>(?:(?!<\/button>).)*Swiss/);
    expect(html).toContain("cover-bold.webp");
    // Only the chosen tile is in the tab order; arrows move between the rest.
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("keeps the sample picture under a live one that starts hidden, so a failed load leaves the sample", () => {
    const live = [{ ...options[0], liveSrc: "/api/assets/a1/cover/preview?layout=BOLD&v=x" }, options[1]];
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options: live, selected: "SWISS", onSelect: () => {} }));
    expect(html).toContain("cover-bold.webp");
    expect(html).toContain("layout=BOLD");
    expect(html.match(/preview\?layout=/g)).toHaveLength(1);
    expect(html).toMatch(/preview\?layout=BOLD[^>]*opacity-0|opacity-0[^>]*preview\?layout=BOLD/);
  });

  it("lets the page know which picture a tile finally showed", () => {
    // onLive is called from the tile's load event; rendering with it must not break the markup.
    const live = [{ ...options[0], liveSrc: "/api/assets/a1/cover/preview?layout=BOLD&v=x" }, options[1]];
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options: live, selected: "SWISS", onSelect: () => {}, onLive: () => {} }));
    expect(html).toContain("layout=BOLD");
  });

  it("says which tile is being drawn", () => {
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options, selected: "SWISS", busy: "SWISS", onSelect: () => {} }));
    expect(html).toContain('aria-busy="true"');
  });

  it("renders scroll chevrons for horizontal scrolling when not wrapped", () => {
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options, selected: "SWISS", onSelect: () => {} }));
    expect(html).toContain('aria-label="Scroll left"');
    expect(html).toContain('aria-label="Scroll right"');
    expect(html).toContain("cursor-grab");
    expect(html).toContain("overflow-x-auto");
  });

  it("renders as a grid and omits scroll chevrons when wrapped", () => {
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options, selected: "SWISS", wrap: true, onSelect: () => {} }));
    expect(html).toContain("grid");
    expect(html).not.toContain('aria-label="Scroll left"');
    expect(html).not.toContain('aria-label="Scroll right"');
  });
});

describe("Segmented", () => {
  it("is a radiogroup with only the chosen segment checked", () => {
    const html = renderToStaticMarkup(
      h(Segmented, { label: "Instagram format", value: "SINGLE", onChange: () => {}, options: [{ id: "CAROUSEL", label: "Carousel" }, { id: "SINGLE", label: "Single poster" }] })
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Instagram format"');
    expect(html).toMatch(/aria-checked="true"[^>]*>(?:(?!<\/button>).)*Single poster/);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  });

  it("asks for the live pictures one at a time, so the first tile is not held up by the rest", () => {
    const live = [
      { ...options[0], liveSrc: "/api/assets/a1/cover/preview?layout=BOLD&v=x" },
      { ...options[1], liveSrc: "/api/assets/a1/cover/preview?layout=SWISS&v=x" },
    ];
    const html = renderToStaticMarkup(h(ThumbPicker, { label: "Layout", options: live, selected: "BOLD", onSelect: () => {} }));
    expect(html).toContain("layout=BOLD");
    expect(html).not.toContain("layout=SWISS");
    // The sample of the waiting tile is still there.
    expect(html).toContain("cover-swiss.webp");
  });
});
