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
});
