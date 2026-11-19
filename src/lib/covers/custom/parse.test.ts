import { describe, expect, it } from "vitest";
import { parseTemplate } from "./parse";
import { GOOD_TEMPLATE } from "./fixtures";

const errorsOf = (html: string) => {
  const r = parseTemplate(html);
  return r.ok ? [] : r.errors;
};
const refused = (html: string, ...needles: string[]) => {
  const e = errorsOf(html);
  expect(e.length, `expected a refusal, got ok for: ${html.slice(0, 80)}`).toBeGreaterThan(0);
  for (const n of needles) expect(e.join(" | ").toLowerCase()).toContain(n.toLowerCase());
};
/** Insert markup as the first child of the root. */
const withChild = (inner: string) => GOOD_TEMPLATE.replace('overflow:hidden">', `overflow:hidden">${inner}`);

describe("a template that follows the contract", () => {
  it("is accepted and reports the slots it uses", () => {
    const r = parseTemplate(GOOD_TEMPLATE);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.template.name).toBe("Soft Blue");
      expect(r.template.slots).toEqual(expect.arrayContaining(["headline", "author_name", "label", "kicker", "photo", "author_role"]));
    }
  });
});

describe("script and markup attacks are refused", () => {
  it.each([
    ["<script> tag", withChild("<script>alert(1)</script>"), "<script>"],
    ["<style> tag", withChild("<style>body{display:none}</style>"), "<style>"],
    ["<iframe>", withChild('<iframe src="https://evil.test"></iframe>'), "<iframe>"],
    ["<link>", withChild('<link rel="stylesheet" href="https://evil.test/x.css">'), "<link>"],
    ["<object>", withChild('<object data="x"></object>'), "<object>"],
    ["<a href>", withChild('<a href="javascript:alert(1)">x</a>'), "<a>"],
    ["<form>", withChild("<form></form>"), "<form>"],
    ["<foreignObject> in svg", withChild('<svg width="10" height="10"><foreignObject><div>x</div></foreignObject></svg>'), "foreignobject"],
    ["<svg><script>", withChild('<svg width="10" height="10"><script>alert(1)</script></svg>'), "script"],
    ["<svg><use href>", withChild('<svg width="10" height="10"><use href="https://evil.test/a.svg#x"/></svg>'), "use"],
    ["<svg><image href>", withChild('<svg width="10" height="10"><image href="https://evil.test/x.png"/></svg>'), "image"],
  ])("%s", (_n, html, needle) => refused(html, needle));

  it.each([
    ["onclick", withChild('<div onclick="alert(1)"></div>'), "onclick"],
    ["onerror on img", withChild('<div data-if="photo"><img src="{{photo}}" width="10" height="10" onerror="alert(1)"/></div>'), "onerror"],
    ["class", withChild('<div class="x"></div>'), "class"],
    ["id on html", withChild('<div id="x"></div>'), "id"],
    ["href on div", withChild('<div href="x"></div>'), "href"],
    ["unknown data attribute", withChild('<div data-evil="1"></div>'), "data-evil"],
    ["srcset", withChild('<div data-if="photo"><img src="{{photo}}" srcset="https://evil.test/a.png 1x" width="10" height="10"/></div>'), "srcset"],
    ["svg onload", withChild('<svg width="10" height="10" onload="alert(1)"></svg>'), "onload"],
  ])("attribute: %s", (_n, html, needle) => refused(html, needle));

  it("HTML entities cannot hide a slot or markup", () => {
    refused(withChild("<div>&#123;&#123;headline&#125;&#125;</div>"), "alone");
    refused(withChild("<div>&lt;script&gt;</div>".replace("&lt;script&gt;", "{{ kicker }}")), "alone");
  });
});

describe("network and file access is refused", () => {
  it.each([
    ["img http", withChild('<img src="https://evil.test/p.png" width="10" height="10"/>')],
    ["img http (relative)", withChild('<img src="//evil.test/p.png" width="10" height="10"/>')],
    ["img file", withChild('<img src="file:///etc/passwd" width="10" height="10"/>')],
    ["img javascript", withChild('<img src="javascript:alert(1)" width="10" height="10"/>')],
    ["img svg data", withChild('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" width="10" height="10"/>')],
    ["img data html", withChild('<img src="data:text/html;base64,PHNjcmlwdD4=" width="10" height="10"/>')],
    ["img internal ip", withChild('<img src="http://169.254.169.254/latest/meta-data/" width="10" height="10"/>')],
    ["img localhost", withChild('<img src="http://localhost:3000/api/x" width="10" height="10"/>')],
  ])("%s", (_n, html) => refused(html, "src"));

  it.each([
    ["background url http", 'background-image:url(https://evil.test/x.png)'],
    ["background url quoted", "background-image:url('https://evil.test/x.png')"],
    ["background url file", "background-image:url(file:///etc/passwd)"],
    ["background shorthand url", "background:url(//evil.test/x.png) no-repeat"],
    ["mask url", "mask-image:url(https://evil.test/x.png)"],
    ["list-style url", "list-style-image:url(https://evil.test/x.png)"],
    ["border-image", "border-image:url(https://evil.test/x.png) 1"],
    ["content url", "content:url(https://evil.test/x.png)"],
    ["@import", "background:red;@import url(https://evil.test/x.css)"],
    ["image-set", "background-image:image-set(url(https://evil.test/x.png) 1x)"],
    ["escaped url", "background-image:\\75rl(https://evil.test/x.png)"],
    ["comment-split url", "background-image:ur/**/l(https://evil.test/x.png)"],
    ["expression()", "width:expression(alert(1))"],
    ["javascript in value", "color:javascript:alert(1)"],
    ["-moz-binding", "-moz-binding:url(https://evil.test/x.xml#x)"],
    ["behavior", "behavior:url(x.htc)"],
    ["calc", "width:calc(100% - 10px)"],
    ["attr()", "width:attr(data-x)"],
    ["position fixed", "position:fixed"],
    ["display grid", "display:grid"],
    ["css variable declaration", "--x:1"],
    ["z-index", "z-index:5"],
    ["custom var read", "color:var(--secret)"],
    ["var with fallback url", "background-image:var(--ink, url(https://evil.test/x.png))"],
  ])("style: %s", (_n, css) => refused(withChild(`<div style="${css}"></div>`)));

  it("accepts a small inline png as a background and as an <img>", () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    expect(errorsOf(withChild(`<div style="background-image:url(data:image/png;base64,${png})"></div>`))).toEqual([]);
    expect(errorsOf(withChild(`<img src="data:image/png;base64,${png}" width="10" height="10"/>`))).toEqual([]);
  });

  it("refuses inline pictures over the byte budget", () => {
    const big = "A".repeat(700 * 1024);
    refused(withChild(`<img src="data:image/png;base64,${big}" width="10" height="10"/>`), "KB");
  });
});

describe("the contract's structure is enforced", () => {
  it("needs exactly one root div with the contract marker", () => {
    refused("", "first");
    refused("hello", "root");
    refused(`${GOOD_TEMPLATE}${GOOD_TEMPLATE}`, "one root");
    refused(GOOD_TEMPLATE.replace('data-cover-template="1"', ""), "data-cover-template");
    refused(GOOD_TEMPLATE.replace('data-name="Soft Blue"', ""), "data-name");
    refused(GOOD_TEMPLATE.replace("width:1080px", "width:1000px"), "1080");
    refused(GOOD_TEMPLATE.replace("height:1350px", "height:1000px"), "1350");
    refused(GOOD_TEMPLATE.replace(/^<div/, "<section").replace(/<\/div>$/, "</section>"), "root");
  });

  it("requires headline and author_name", () => {
    refused(GOOD_TEMPLATE.replace("{{headline}}", "{{kicker}}"), "{{headline}}");
    refused(GOOD_TEMPLATE.replace("{{author_name}}", "Alex"), "{{author_name}}");
  });

  it("allows the headline only once", () => {
    refused(withChild('<div data-fit data-max-lines="1" data-min-size="48" data-max-size="60" style="width:400px;font-family:\'Bricolage Grotesque\'">{{headline}}</div>'), "once");
  });

  it("refuses unknown slots, slots in attributes and slots mixed with text", () => {
    refused(withChild('<div data-fit data-max-lines="1" data-min-size="30" data-max-size="40" style="width:400px;font-family:\'Plus Jakarta Sans\'">{{password}}</div>'), "not a slot");
    refused(withChild('<div style="color:{{headline}}"></div>'), "color");
    refused(withChild("<div>By {{author_name}}</div>"), "alone");
    refused(withChild('<div title="{{headline}}"></div>'), "title");
  });

  it("makes optional slots sit under data-if", () => {
    refused(GOOD_TEMPLATE.replace('<div data-if="kicker" style="display:flex;margin-top:32px">', '<div style="display:flex;margin-top:32px">'), "data-if");
    refused(GOOD_TEMPLATE.replace('data-if="photo"', 'data-if="kicker"'), "data-if");
    refused(withChild('<div data-if="headline"></div>'), "optional");
  });

  it("holds a fitted element to its box rules", () => {
    refused(GOOD_TEMPLATE.replace('data-max-lines="3" ', ""), "data-max-lines");
    refused(GOOD_TEMPLATE.replace('data-min-size="48"', 'data-min-size="20"'), "48");
    refused(GOOD_TEMPLATE.replace('data-min-size="30" data-max-size="40" style="width:900px;font-family:\'Plus Jakarta Sans\';color:var(--secondary)">{{kicker}}', 'data-min-size="12" data-max-size="40" style="width:900px;font-family:\'Plus Jakarta Sans\'">{{kicker}}'), "30");
    refused(GOOD_TEMPLATE.replace("width:900px;font-family:'Bricolage Grotesque'", "font-family:'Bricolage Grotesque'"), "width");
    refused(GOOD_TEMPLATE.replace("width:900px;font-family:'Bricolage Grotesque'", "width:900px;padding:10px;font-family:'Bricolage Grotesque'"), "padding");
    refused(GOOD_TEMPLATE.replace("width:900px;font-family:'Bricolage Grotesque';font-weight:800;", "width:900px;"), "font-family");
    refused(GOOD_TEMPLATE.replace('data-emphasis-color="accent"', 'data-emphasis-color="pink"'), "data-emphasis-color");
    refused(withChild("<div data-fit>x</div>"), "exactly one slot");
  });

  it("allows fonts we bundle only", () => {
    refused(GOOD_TEMPLATE.replace("'Bricolage Grotesque'", "'Comic Sans MS'"), "Comic Sans");
    refused(GOOD_TEMPLATE.replace("'Bricolage Grotesque'", "'Bricolage Grotesque', Impact"), "Impact");
  });

  it("refuses malformed HTML instead of guessing", () => {
    refused(withChild('<div style="color:red" style="color:blue"></div>'), "malformed");
    refused(withChild("<div <=\"x\"></div>"), "malformed");
  });

  it("caps size, depth and element count", () => {
    refused(withChild(`<div>${"a".repeat(210 * 1024)}</div>`), "KB");
    refused(withChild("<div>".repeat(30) + "</div>".repeat(30)), "nested");
    refused(withChild("<span></span>".repeat(450)), "elements");
  });

  it("limits var() in SVG attributes to the brand colours", () => {
    refused(withChild('<svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="var(--secret)"/></svg>'), "var(--secret)");
  });

  it("never throws, whatever it is given", () => {
    for (const junk of [null, undefined, 42, {}, [], "\u0000", "<", "<div", "{{", "<div style='", "<!--", "<svg><svg><svg>", "<div style=\"" + "(".repeat(5000) + "\">"]) {
      expect(() => parseTemplate(junk as never)).not.toThrow();
    }
  });
});
