import { describe, expect, it } from "vitest";
import { layoutUnavailable, type LayoutFacts } from "./available";

const read: LayoutFacts = {
  shape_read: true,
  list: ["API endpoints", "Auth logic", "Response parsers"],
  grid: [{ label: "CRM", icon: "DATABASE" }, { label: "Calendar", icon: "CALENDAR_BLANK" }, { label: "Phone", icon: "PHONE_CALL" }],
  punch: { lines: ["A.", "B.", "C."], checks: ["x y", "y z", "z w"] },
  number: { value: "10" },
  photo_ok: true,
  quote_ok: true,
};

describe("layoutUnavailable", () => {
  it("allows every layout the cover has what it needs for", () => {
    for (const l of ["HEADLINE", "STATEMENT", "LIST", "GRID", "PUNCH", "PHOTO", "QUOTE", "NUMBER"] as const) {
      expect(layoutUnavailable(l, read)).toBeNull();
    }
  });

  it("disables List, Grid and Punch until the post's points are read, and says it is checking", () => {
    const unread = { ...read, shape_read: false, list: null, grid: null, punch: null };
    for (const l of ["LIST", "GRID", "PUNCH"] as const) {
      expect(layoutUnavailable(l, unread, { checking: true })).toMatch(/Checking/);
      expect(layoutUnavailable(l, unread)).toMatch(/couldn't be checked/i);
    }
  });

  it("disables List, Grid and Punch when the post lacks them", () => {
    const none = { ...read, list: null, grid: null, punch: null };
    expect(layoutUnavailable("LIST", none)).toMatch(/3 or 4/);
    expect(layoutUnavailable("GRID", none)).toMatch(/3 to 6/);
    expect(layoutUnavailable("PUNCH", none)).toMatch(/punch/);
  });

  it("disables Quote, Photo and Number when the post or brand can't supply them", () => {
    expect(layoutUnavailable("QUOTE", { ...read, quote_ok: false })).toMatch(/quote/i);
    expect(layoutUnavailable("PHOTO", { ...read, photo_ok: false })).toMatch(/headshot/);
    expect(layoutUnavailable("NUMBER", { ...read, number: null })).toMatch(/figure/);
  });

  it("never disables Headline or Statement", () => {
    const bare: LayoutFacts = { shape_read: false, list: null, grid: null, punch: null, number: null, photo_ok: false, quote_ok: false };
    expect(layoutUnavailable("HEADLINE", bare)).toBeNull();
    expect(layoutUnavailable("STATEMENT", bare)).toBeNull();
  });
});
