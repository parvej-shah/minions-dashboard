import { describe, expect, it } from "vitest";
import { contractPrompt } from "./contract";
import { GOOD_TEMPLATE } from "./fixtures";
import { parseTemplate } from "./parse";
import { isThemed, themeColourProblems } from "./themeColours";

function problems(html: string): string[] {
  const p = parseTemplate(html);
  if (!p.ok) throw new Error(p.errors.join("; "));
  return themeColourProblems(p.template.root);
}

const wrap = (inner: string, rootBg = "background-color:var(--paper)") =>
  `<div data-cover-template="1" data-name="T" style="display:flex;flex-direction:column;width:1080px;height:1350px;overflow:hidden;${rootBg}">${inner}` +
  `<div data-fit data-max-lines="1" data-min-size="30" data-max-size="40" style="width:700px;font-family:'Plus Jakarta Sans';color:var(--ink)">{{author_name}}</div></div>`;

const headline = (style: string) =>
  `<div data-fit data-max-lines="3" data-min-size="48" data-max-size="120" style="width:900px;font-family:'Bricolage Grotesque';font-weight:800;${style}">{{headline}}</div>`;

describe("isThemed", () => {
  it("accepts theme colours, theme gradients, pictures and transparent", () => {
    for (const v of ["var(--ink)", " var(--accent) ", "linear-gradient(160deg, var(--paper) 0%, var(--accent) 100%)", "radial-gradient(circle at top left, var(--secondary), transparent)", "transparent", "none"]) expect(isThemed(v), v).toBe(true);
  });
  it("refuses fixed colours, alone or inside a gradient", () => {
    for (const v of ["#1561F0", "#fff", "rgb(0,0,0)", "rgba(255,255,255,0.1)", "hsl(200 50% 50%)", "white", "navy", "linear-gradient(160deg, #1561F0, var(--paper))", "var(--brand)"]) expect(isThemed(v), v).toBe(false);
  });
});

describe("themeColourProblems", () => {
  it("passes the reference design", () => {
    expect(problems(GOOD_TEMPLATE)).toEqual([]);
  });

  it("refuses a fixed text colour and names the slot", () => {
    for (const c of ["#FFFFFF", "rgb(255,255,255)", "white"]) {
      const out = problems(wrap(headline(`color:${c}`)));
      expect(out.join(" "), c).toMatch(/headline colour must be a theme colour/);
    }
  });

  it("refuses text with no colour set anywhere", () => {
    expect(problems(wrap(headline(""))).join(" ")).toMatch(/headline has no colour/);
  });

  it("lets text inherit a theme colour from a parent", () => {
    expect(problems(wrap(`<div style="display:flex;color:var(--ink)">${headline("")}</div>`))).toEqual([]);
  });

  it("refuses a fixed or missing cover background", () => {
    expect(problems(wrap(headline("color:var(--ink)"), "background-color:#0B47D0")).join(" ")).toMatch(/cover's background must use theme colours/);
    expect(problems(wrap(headline("color:var(--ink)"), "background-image:linear-gradient(#000, #111)")).join(" ")).toMatch(/cover's background/);
    expect(problems(wrap(headline("color:var(--ink)"), "")).join(" ")).toMatch(/cover has no background/);
  });

  it("accepts a cover background that is a gradient of theme colours", () => {
    expect(problems(wrap(headline("color:var(--ink)"), "background-image:linear-gradient(160deg, var(--paper), var(--accent))"))).toEqual([]);
  });

  it("refuses a fixed-colour panel behind text", () => {
    const out = problems(wrap(`<div style="display:flex;background-color:rgba(110,180,255,0.88)">${headline("color:var(--ink)")}</div>`));
    expect(out.join(" ")).toMatch(/background behind the headline must use theme colours/);
  });

  it("lets icons, SVG and shapes not behind text keep their own colours", () => {
    const deco =
      `<div style="display:flex;position:absolute;top:0px;right:0px;width:200px;height:200px;background-color:#3D8BF2;border:2px solid #ffffff"></div>` +
      `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#ff0000" stroke="white"/></svg>`;
    expect(problems(wrap(deco + headline("color:var(--ink)")))).toEqual([]);
  });

  it("the instructions tell designers the rule", () => {
    expect(contractPrompt()).toMatch(/Every text colour, the cover's background and any background behind text must use these/);
  });
});
