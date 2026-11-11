import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Brand page section ordering", () => {
  it("renders CoverThemeCard as the first section before WhatYouDo and other basics", () => {
    const pagePath = path.resolve(__dirname, "../app/(dashboard)/brand/page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    const basicsStart = content.indexOf("<div key={importVersion}");
    expect(basicsStart).toBeGreaterThan(-1);
    const basicsSection = content.slice(basicsStart);

    const coverThemeIdx = basicsSection.indexOf("<CoverThemeCard");
    const whatYouDoIdx = basicsSection.indexOf("<WhatYouDo");
    const icpEditorIdx = basicsSection.indexOf("<IcpEditor");
    const memorySectionIdx = basicsSection.indexOf("<MemorySection");

    expect(coverThemeIdx).toBeGreaterThan(-1);
    expect(whatYouDoIdx).toBeGreaterThan(-1);
    expect(icpEditorIdx).toBeGreaterThan(-1);
    expect(memorySectionIdx).toBeGreaterThan(-1);

    expect(coverThemeIdx).toBeLessThan(whatYouDoIdx);
    expect(coverThemeIdx).toBeLessThan(icpEditorIdx);
    expect(coverThemeIdx).toBeLessThan(memorySectionIdx);
  });
});
