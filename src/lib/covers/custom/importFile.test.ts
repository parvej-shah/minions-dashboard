import { describe, expect, it } from "vitest";
import { readDesignFile } from "./importFile";

const file = (body: string, name: string) => new File([body], name, { type: "text/html" });

describe("readDesignFile", () => {
  it("returns the text of an .html file", async () => {
    expect(await readDesignFile(file("  <div>x</div>\n", "cover.html"))).toEqual({ ok: true, text: "<div>x</div>" });
    expect((await readDesignFile(file("<div/>", "COVER.HTM"))).ok).toBe(true);
  });
  it("refuses other types, empty files and files over 200 KB", async () => {
    expect(await readDesignFile(file("<div/>", "cover.png"))).toEqual({ ok: false, error: "Pick an .html file." });
    expect(await readDesignFile(file("   ", "cover.html"))).toEqual({ ok: false, error: "That file is empty." });
    const big = await readDesignFile(file("a".repeat(200 * 1024 + 1), "cover.html"));
    expect(big.ok).toBe(false);
  });
});
