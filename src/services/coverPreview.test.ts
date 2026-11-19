import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { CoverFitError } from "@/lib/covers/layouts";
import { GOOD_TEMPLATE } from "@/lib/covers/custom/fixtures";
import { parseTemplate } from "@/lib/covers/custom/parse";

const findAsset = vi.fn();
const findProfile = vi.fn();
const update = vi.fn();
const upload = vi.fn();
const render = vi.fn();
const renderSvg = vi.fn();
const photo = vi.fn(async (): Promise<string | undefined> => undefined);
vi.mock("@/lib/prisma", () => ({ prisma: { asset: { findUnique: findAsset, update }, brandProfile: { findUnique: findProfile } } }));
vi.mock("@/lib/r2", () => ({ uploadToR2: upload, deleteFromR2: vi.fn(), r2KeyFromUrl: vi.fn() }));
vi.mock("@/lib/covers/render", async (orig) => ({ ...(await orig<typeof import("@/lib/covers/render")>()), renderCoverPng: render, renderCoverSvg: renderSvg }));
const cutoutOf = vi.fn(async (): Promise<{ src: string } | undefined> => undefined);
vi.mock("@/services/cover", () => ({ hostedCoverPhoto: photo, coverCutout: cutoutOf }));

const { renderLayoutPreview } = await import("./coverPreview");

const stored = {
  layout: "HEADLINE",
  headline: "Why buyers leave after one call",
  kicker: "Three fixes.",
  emphasis: "leave",
  number: { value: "3x" },
  author: { name: "Ada", role: "Founder", has_photo: false },
  brand: DEFAULT_COVER_BRAND,
  card: { shape: { list: { items: ["One", "Two", "Three"] } } },
  art_style: "NONE",
};
const asset = { id: "a1", clientId: "c1", title: "Why buyers leave", content: "Body. \"Speed to lead decides the deal.\"", linkedinVariant: null, coverSpec: stored };

let png: Buffer;
let n = 0;
beforeEach(async () => {
  vi.clearAllMocks();
  png = await sharp({ create: { width: 108, height: 135, channels: 3, background: "#123456" } }).png().toBuffer();
  render.mockResolvedValue(png);
  renderSvg.mockResolvedValue('<svg width="1080" height="1350"></svg>');
  photo.mockResolvedValue(undefined);
  // A new headline per test: tiles are remembered by their words.
  n += 1;
  findAsset.mockResolvedValue({ ...asset, coverSpec: { ...stored, headline: `${stored.headline} ${n}` } });
  findProfile.mockResolvedValue({ primaryLogoUrl: "", coverPhotoUrl: null, coverPhotoSource: null, visualAssets: null });
});

describe("renderLayoutPreview", () => {
  it("draws this post's own headline and subtitle in the asked layout", async () => {
    const r = await renderLayoutPreview("c1", "a1", "BOLD");
    expect(r.ok).toBe(true);
    const spec = renderSvg.mock.calls[0][0];
    expect(spec).toMatchObject({ layout: "BOLD", headline: `${stored.headline} ${n}`, kicker: stored.kicker });
  });

  it("returns the tile as a vector picture the browser draws, without rasterizing on the server", async () => {
    const r = await renderLayoutPreview("c1", "a1", "HEADLINE");
    if (!r.ok) throw new Error(r.error);
    expect(r.type).toBe("image/svg+xml");
    expect(r.body.toString()).toContain("<svg");
    expect(render).not.toHaveBeenCalled();
  });

  it("falls back to a small webp when the words need letters our fonts lack", async () => {
    findAsset.mockResolvedValue({ ...asset, coverSpec: { ...stored, headline: `দ্রুত উত্তর ${n}` } });
    const r = await renderLayoutPreview("c1", "a1", "HEADLINE");
    if (!r.ok) throw new Error(r.error);
    expect(r.type).toBe("image/webp");
    expect(await sharp(r.body).metadata()).toMatchObject({ format: "webp", width: 216, height: 270 });
    expect(renderSvg).not.toHaveBeenCalled();
  });

  it("embeds a shrunk headshot in the tile, not the full photo", async () => {
    const big = await sharp({ create: { width: 1600, height: 1600, channels: 3, background: "#884422" } }).jpeg().toBuffer();
    photo.mockResolvedValue(`data:image/jpeg;base64,${big.toString("base64")}`);
    findProfile.mockResolvedValue({ primaryLogoUrl: `https://cdn/p${n}.jpg`, coverPhotoUrl: null, coverPhotoSource: null, visualAssets: null });
    const r = await renderLayoutPreview("c1", "a1", "BOLD");
    expect(r.ok).toBe(true);
    const sent = renderSvg.mock.calls[0][0].author.photo as string;
    const meta = await sharp(Buffer.from(sent.split(",")[1], "base64")).metadata();
    expect(meta.width).toBeLessThanOrEqual(480);
  });

  it("writes nothing: no upload, no row update", async () => {
    await renderLayoutPreview("c1", "a1", "BOLD");
    expect(upload).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a layout the post cannot fill, the way a click would", async () => {
    findAsset.mockResolvedValue({ ...asset, coverSpec: { ...stored, headline: `x${n}`, card: {} } });
    const r = await renderLayoutPreview("c1", "a1", "GRID");
    expect(r).toMatchObject({ ok: false, status: 422 });
    expect(renderSvg).not.toHaveBeenCalled();
  });

  it("refuses another workspace's post", async () => {
    const r = await renderLayoutPreview("other", "a1", "BOLD");
    expect(r).toMatchObject({ ok: false, status: 404 });
  });

  it("has nothing to draw before the post has a cover", async () => {
    findAsset.mockResolvedValue({ ...asset, coverSpec: null });
    expect(await renderLayoutPreview("c1", "a1", "BOLD")).toMatchObject({ ok: false, status: 404 });
  });

  it("falls back through shorter copy when the first does not fit, but keeps the layout", async () => {
    renderSvg.mockRejectedValueOnce(new CoverFitError("too long"));
    const r = await renderLayoutPreview("c1", "a1", "BOLD");
    expect(r.ok).toBe(true);
    expect(renderSvg.mock.calls.length).toBe(2);
    expect(renderSvg.mock.calls[1][0].layout).toBe("BOLD");
  });

  it("reports a fit failure when nothing fits", async () => {
    renderSvg.mockRejectedValue(new CoverFitError("too long"));
    expect(await renderLayoutPreview("c1", "a1", "BOLD")).toMatchObject({ ok: false, status: 422 });
  });

  it("reuses a tile it already drew for the same words", async () => {
    await renderLayoutPreview("c1", "a1", "SWISS");
    await renderLayoutPreview("c1", "a1", "SWISS");
    expect(renderSvg).toHaveBeenCalledTimes(1);
  });

  describe("in one of the workspace's own designs (task 100)", () => {
    const parsed = parseTemplate(GOOD_TEMPLATE);
    if (!parsed.ok) throw new Error(parsed.errors.join("; "));
    const design = { id: "d1", version: 2, template: parsed.template };

    it("draws the post's own words in that design", async () => {
      const r = await renderLayoutPreview("c1", "a1", "CUSTOM", design);
      expect(r.ok).toBe(true);
      expect(renderSvg.mock.calls[0][0]).toMatchObject({ layout: "CUSTOM", custom: { id: "d1", version: 2 }, headline: `${stored.headline} ${n}`, kicker: stored.kicker });
      expect(renderSvg.mock.calls[0][0].custom.template).toBe(parsed.template);
    });

    it("reads the cut-out only when the design uses it", async () => {
      await renderLayoutPreview("c1", "a1", "CUSTOM", design);
      expect(cutoutOf).not.toHaveBeenCalled();
      const withCutout = parseTemplate(GOOD_TEMPLATE.replace('<svg width="64"', '<div data-if="cutout" style="display:flex"><img src="{{cutout}}" width="200" height="300" style="object-fit:contain" /></div><svg width="64"'));
      if (!withCutout.ok) throw new Error(withCutout.errors.join("; "));
      await renderLayoutPreview("c1", "a1", "CUSTOM", { ...design, template: withCutout.template });
      expect(cutoutOf).toHaveBeenCalledTimes(1);
    });

    it("has nothing to draw without the design", async () => {
      expect(await renderLayoutPreview("c1", "a1", "CUSTOM")).toMatchObject({ ok: false, status: 404 });
      expect(renderSvg).not.toHaveBeenCalled();
    });

    it("draws each version of a design as its own tile", async () => {
      await renderLayoutPreview("c1", "a1", "CUSTOM", design);
      await renderLayoutPreview("c1", "a1", "CUSTOM", { ...design, version: 3 });
      expect(renderSvg).toHaveBeenCalledTimes(2);
    });
  });
});
