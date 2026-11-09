import { describe, expect, it } from "vitest";
import { coverBrand } from "./brand";
import { BACKGROUND_FOR, BACKGROUNDS, blockColour, brandOn, contrastOf, DARK_BACKGROUNDS, ground } from "./backgrounds";
import { COVER_LAYOUTS, CoverFitError, type CoverSpec } from "./layouts";
import { renderCoverPng } from "./render";
import { editShape, parseShape, shapeJson, type PosterShape } from "./shape";
import { eligibleTypes, fallbackOrder, pickPosterType } from "./posterType";
import { imageInfo, photoFitsPoster } from "./photo";

const BODY = `We lost three deals last month because callbacks took 10 minutes. API endpoints, authentication logic,
response parsers and custom wrappers all slowed us down. Demos move fast. Buyers hang up. Leads go cold.`;

const goodShape = {
  list: { title: "Where our callbacks slowed down", items: ["API endpoints", "Authentication logic", "Response parsers", "Custom wrappers"] },
  grid: { title: "What the agent connects to", items: [{ label: "Calendar", icon: "CALENDAR_BLANK" }, { label: "CRM", icon: "DATABASE" }, { label: "Phone line", icon: "PHONE_CALL" }] },
  punch: { lines: ["Demos move fast.", "Buyers hang up.", "Leads go cold."], checks: ["Test latency live", "Measure response time", "Keep buyers on the line"] },
  own_story: true,
};

describe("parseShape", () => {
  it("keeps parts that pass every check", () => {
    const notes: string[] = [];
    const s = parseShape(goodShape, BODY, notes);
    expect(s.list?.items).toHaveLength(4);
    expect(s.punch?.lines[2]).toBe("Leads go cold.");
    expect(s.own_story).toBe(true);
  });

  it("drops a figure the post does not state", () => {
    const notes: string[] = [];
    const s = parseShape({ list: { title: "Where callbacks slowed down", items: ["API endpoints", "Cut 45% of calls", "Response parsers"] } }, BODY, notes);
    expect(s.list).toBeUndefined();
    expect(notes[0]).toMatch(/45%/);
  });

  it("drops an item that is too long or has a colon", () => {
    const notes: string[] = [];
    expect(parseShape({ list: { title: "Where callbacks slowed down", items: ["API endpoints and every single one of the wrappers", "Parsers", "Wrappers"] } }, BODY, notes).list).toBeUndefined();
    expect(parseShape({ list: { title: "Where callbacks slowed down", items: ["Step one: endpoints", "Auth logic here", "Response parsers"] } }, BODY, notes).list).toBeUndefined();
  });

  it("drops a grid with an icon that does not exist", () => {
    const notes: string[] = [];
    const s = parseShape({ grid: { ...goodShape.grid, items: [...goodShape.grid.items.slice(0, 2), { label: "Phone line", icon: "UNICORN" }] } }, BODY, notes);
    expect(s.grid).toBeUndefined();
    expect(notes[0]).toMatch(/UNICORN/);
  });

  it("reads the JSON out of a chat-completions envelope", () => {
    const body = JSON.stringify({ choices: [{ message: { content: "```json\n{\"own_story\": true}\n```" } }] });
    expect(shapeJson(body)).toEqual({ own_story: true });
    expect(shapeJson("no json here")).toBeNull();
  });
});

describe("editShape", () => {
  const shape = parseShape(goodShape, BODY);
  it("takes a reviewer's list that passes the checks", () => {
    const r = editShape(shape, { list: ["API endpoints", "Auth logic", "Response parsers"] }, BODY);
    expect("shape" in r && r.shape.list?.items).toEqual(["API endpoints", "Auth logic", "Response parsers"]);
  });
  it("refuses a reviewer's figure the post does not state", () => {
    const r = editShape(shape, { punch: { lines: ["Demos move fast.", "We won 80% more.", "Leads go cold."], checks: goodShape.punch.checks } }, BODY);
    expect("error" in r && r.error).toMatch(/80%/);
  });
  it("keeps each grid tile's icon and refuses a different count", () => {
    const r = editShape(shape, { grid_labels: ["Calendar", "CRM", "Phones"] }, BODY);
    expect("shape" in r && r.shape.grid?.items.map((i) => i.icon)).toEqual(["CALENDAR_BLANK", "DATABASE", "PHONE_CALL"]);
    expect("error" in editShape(shape, { grid_labels: ["Calendar", "CRM"] }, BODY)).toBe(true);
  });
});

describe("pickPosterType", () => {
  const shape = parseShape(goodShape, BODY);
  const prose: PosterShape = { own_story: false };

  it("never repeats the last type", () => {
    for (const last of COVER_LAYOUTS) {
      expect(pickPosterType({ shape, photoOk: true, recent: [last], judged: { number: true, quote: true } })).not.toBe(last);
      expect(pickPosterType({ shape: prose, photoOk: false, recent: [last] })).not.toBe(last);
    }
  });

  it("uses the photo only with a usable photo, the author's own story and none in the last 3", () => {
    expect(pickPosterType({ shape, photoOk: true, recent: [] })).toBe("PHOTO");
    expect(eligibleTypes({ shape, photoOk: false, recent: [] })).not.toContain("PHOTO");
    expect(eligibleTypes({ shape: { ...shape, own_story: false }, photoOk: true, recent: [] })).not.toContain("PHOTO");
    expect(eligibleTypes({ shape, photoOk: true, recent: ["LIST", "GRID", "PHOTO"] })).not.toContain("PHOTO");
    expect(eligibleTypes({ shape, photoOk: true, recent: ["LIST", "GRID", "PUNCH", "PHOTO"] })).toContain("PHOTO");
  });

  it("falls back to the headline types when the post has no structure", () => {
    expect(["STATEMENT", "HEADLINE"]).toContain(pickPosterType({ shape: prose, photoOk: false, recent: [] }));
    expect(pickPosterType({ photoOk: false, recent: ["STATEMENT"] })).toBe("HEADLINE");
  });

  it("makes the first post the photo poster when there is a photo, else Statement", () => {
    expect(pickPosterType({ photoOk: true, recent: [], firstPost: true })).toBe("PHOTO");
    expect(pickPosterType({ photoOk: false, recent: [], firstPost: true })).toBe("STATEMENT");
  });

  it("keeps a feed varied: a run of structured posts uses at least 4 types and never one twice in a row", () => {
    const recent: string[] = [];
    for (let i = 0; i < 24; i++) recent.unshift(pickPosterType({ shape, photoOk: true, recent }));
    expect(new Set(recent).size).toBeGreaterThanOrEqual(4);
    expect(recent.some((t, i) => i > 0 && recent[i - 1] === t)).toBe(false);
    const most = Math.max(...[...new Set(recent)].map((t) => recent.filter((r) => r === t).length));
    expect(most / recent.length).toBeLessThanOrEqual(0.4);
  });

  it("tries the picked type first and ends with the plain headline", () => {
    expect(fallbackOrder("LIST", ["LIST", "PUNCH", "STATEMENT", "HEADLINE"])).toEqual(["LIST", "PUNCH", "STATEMENT", "HEADLINE"]);
  });
});

describe("photo check", () => {
  const png = (w: number, h: number, colourType: number) => {
    const b = Buffer.alloc(40);
    b.writeUInt32BE(0x89504e47, 0);
    b.writeUInt32BE(w, 16);
    b.writeUInt32BE(h, 20);
    b[25] = colourType;
    b.write("IDAT", 33);
    return b;
  };
  it("takes an opaque portrait headshot", () => expect(photoFitsPoster(imageInfo(png(1086, 1448, 2)))).toBe(true));
  it("refuses a transparent logo", () => expect(photoFitsPoster(imageInfo(png(1086, 1448, 6)))).toBe(false));
  it("refuses a small or wide image", () => {
    expect(photoFitsPoster(imageInfo(png(400, 400, 2)))).toBe(false);
    expect(photoFitsPoster(imageInfo(png(1600, 600, 2)))).toBe(false);
  });
  it("refuses what is not a PNG or JPEG", () => expect(photoFitsPoster(imageInfo(Buffer.from("GIF89a....")))).toBe(false));
});

const palettes = {
  default: coverBrand({}).brand,
  blue: coverBrand({ ink: "#0B1F3A", paper: "#F5F8FC", accent: "#2563EB", secondary: "#0EA5E9" }).brand,
};

describe("backgrounds keep text readable", () => {
  for (const [name, brand] of Object.entries(palettes)) {
    it(`${name}: every background's worst-case ground passes`, () => {
      for (const bg of BACKGROUNDS) {
        const g = ground(bg, brand);
        const tuned = brandOn(bg, brand);
        const dark = DARK_BACKGROUNDS.includes(bg);
        const text = dark ? brand.paper : brand.ink;
        const accent = dark ? tuned.accentOnInk : tuned.accent;
        expect(contrastOf(text, g.text), `${bg} text`).toBeGreaterThanOrEqual(4.5);
        expect(contrastOf(accent, g.text), `${bg} accent`).toBeGreaterThanOrEqual(3);
        const footerText = bg === "BLOCK" ? brand.paper : text;
        expect(contrastOf(footerText, g.footer), `${bg} footer`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastOf(brand.paper, blockColour(brand))).toBeGreaterThanOrEqual(4.5);
    });
  }
  it("leaves an accent alone where it already reads", () => {
    expect(brandOn("BLOCK", palettes.blue).accent).toBe(palettes.blue.accent);
  });
  it("gives every layout a background", () => {
    for (const l of COVER_LAYOUTS) expect(BACKGROUNDS).toContain(BACKGROUND_FOR[l]);
  });
});

describe("every poster type renders", () => {
  // A 1x1 opaque PNG is enough for the renderer; the size check is the service's job.
  const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYPgPAAEDAQAIicLsAAAAAElFTkSuQmCC";
  const shape = parseShape(goodShape, BODY);
  for (const [name, brand] of Object.entries(palettes)) {
    for (const layout of COVER_LAYOUTS) {
      it(`${layout} in ${name}`, async () => {
        const spec: CoverSpec = {
          layout,
          label: "For real estate brokerages",
          headline: "Your 10-minute callback is racing the wrong competitor",
          emphasis: "competitor",
          quote: "A booking is only real when the calendar and CRM prove it exists.",
          number: { value: "10", unit: "minutes" },
          list: shape.list?.items,
          grid: shape.grid?.items,
          punch: shape.punch,
          author: { name: "Parvej Shah", role: "Founder, Minions.AI", photo },
          brand,
        };
        const png = await renderCoverPng(spec);
        expect(png.subarray(1, 4).toString()).toBe("PNG");
      }, 20_000);
    }
  }
  it("refuses a photo poster with no photo", async () => {
    await expect(renderCoverPng({ layout: "PHOTO", headline: "A headline", author: { name: "A" }, brand: palettes.default })).rejects.toBeInstanceOf(CoverFitError);
  });
});
