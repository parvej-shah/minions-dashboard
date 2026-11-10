import { describe, expect, it } from "vitest";
import { coverBrand } from "./brand";
import { COVER_THEMES, DEFAULT_COVER_THEME, themeColours, themeOf } from "./themes";
import { DEFAULT_PALETTE } from "@/constants/brand";

describe("cover themes", () => {
  // Classic is the old palette: its coral was always deepened a little on cream.
  it.each(COVER_THEMES.filter((t) => t.id !== "classic").map((t) => [t.id, t] as const))("%s draws exactly as shown: no colour is replaced or deepened", (_, t) => {
    const { brand, notes } = coverBrand({ ink: t.primary_ink, paper: t.brand_cream, accent: t.brand_coral, secondary: t.brand_teal });
    expect(notes).toEqual([]);
    expect(brand.ink).toBe(t.primary_ink.toLowerCase());
    expect(brand.paper).toBe(t.brand_cream.toLowerCase());
    expect(brand.accent).toBe(t.brand_coral.toLowerCase());
  });

  it("names a theme from its colours, in any case, and calls anything else custom", () => {
    expect(themeOf({ primary_ink: "#1d1d1f", brand_cream: "#f5f5f7", brand_coral: "#0066cc", brand_teal: "#1d1d1f" })?.id).toBe("graphite");
    expect(themeOf({ ...themeColours(DEFAULT_COVER_THEME), brand_coral: "#FF0000" })).toBeNull();
  });

  it("new workspaces start on the default theme; the old palette is Classic", () => {
    expect(DEFAULT_COVER_THEME.id).toBe("graphite");
    expect(themeOf({ primary_ink: DEFAULT_PALETTE.primaryInk, brand_cream: DEFAULT_PALETTE.brandCream, brand_coral: DEFAULT_PALETTE.brandCoral, brand_teal: DEFAULT_PALETTE.brandTeal })?.id).toBe("graphite");
    expect(themeOf({ primary_ink: "#12242A", brand_cream: "#FFF8F0", brand_coral: "#FF6B4A", brand_teal: "#0E5C63" })?.id).toBe("classic");
  });
});
