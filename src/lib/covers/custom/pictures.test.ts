import { describe, expect, it } from "vitest";
import { parseTemplate } from "./parse";
import { pictureProblems, STAND_IN } from "./pictures";

function problems(html: string): string[] {
  const p = parseTemplate(html);
  if (!p.ok) throw new Error(p.errors.join("; "));
  return pictureProblems(p.template.root);
}

const wrap = (inner: string) =>
  `<div data-cover-template="1" data-name="T" style="display:flex;flex-direction:column;width:1080px;height:1350px;overflow:hidden;background-color:var(--paper)">${inner}` +
  `<div data-fit data-max-lines="3" data-min-size="48" data-max-size="120" style="width:900px;font-family:'Bricolage Grotesque';color:var(--ink)">{{headline}}</div>` +
  `<div data-fit data-max-lines="1" data-min-size="30" data-max-size="40" style="width:700px;font-family:'Plus Jakarta Sans';color:var(--ink)">{{author_name}}</div></div>`;

const cutout = (style: string) => `<div data-if="cutout" style="display:flex"><img src="{{cutout}}" width="600" height="800" style="${style}" /></div>`;
const photo = (style: string) => `<div data-if="photo" style="display:flex"><img src="{{photo}}" width="120" height="120" style="${style}" /></div>`;

describe("pictureProblems", () => {
  it("refuses a cut-out that is not object-fit:contain", () => {
    expect(problems(wrap(cutout(""))).join(" ")).toMatch(/cut-out needs object-fit:contain/);
    expect(problems(wrap(cutout("object-fit:cover"))).join(" ")).toMatch(/cut-out needs object-fit:contain/);
    expect(problems(wrap(cutout("object-fit:contain;object-position:bottom")))).toEqual([]);
  });

  it("refuses a headshot with no object-fit, accepts cover or contain", () => {
    expect(problems(wrap(photo("border-radius:999px"))).join(" ")).toMatch(/headshot needs object-fit:cover/);
    expect(problems(wrap(photo("object-fit:cover;border-radius:999px")))).toEqual([]);
    expect(problems(wrap(photo("object-fit:contain")))).toEqual([]);
  });

  it("leaves inline pictures alone", () => {
    const inline = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="40" height="40" />`;
    expect(problems(wrap(inline))).toEqual([]);
  });

  it("has stand-ins in the real shapes", () => {
    expect(STAND_IN.cutout).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(STAND_IN.photo).toMatch(/^data:image\/svg\+xml;base64,/);
    const cut = Buffer.from(STAND_IN.cutout.split(",")[1], "base64").toString();
    expect(cut).toMatch(/viewBox="0 0 600 800"/);
  });
});
