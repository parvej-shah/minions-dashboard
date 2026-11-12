import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { CoverFitError } from "@/lib/covers/layouts";

const findAsset = vi.fn();
const findProfile = vi.fn();
const update = vi.fn();
const upload = vi.fn();
const render = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { asset: { findUnique: findAsset, update }, brandProfile: { findUnique: findProfile } } }));
vi.mock("@/lib/r2", () => ({ uploadToR2: upload, deleteFromR2: vi.fn(), r2KeyFromUrl: vi.fn() }));
vi.mock("@/lib/covers/render", () => ({ renderCoverPng: render }));
vi.mock("@/services/cover", () => ({ hostedCoverPhoto: vi.fn(async () => undefined), coverCutout: vi.fn(async () => undefined) }));

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
  // A new headline per test: tiles are remembered by their words.
  n += 1;
  findAsset.mockResolvedValue({ ...asset, coverSpec: { ...stored, headline: `${stored.headline} ${n}` } });
  findProfile.mockResolvedValue({ primaryLogoUrl: "", coverPhotoUrl: null, coverPhotoSource: null, visualAssets: null });
});

describe("renderLayoutPreview", () => {
  it("draws this post's own headline and subtitle in the asked layout", async () => {
    const r = await renderLayoutPreview("c1", "a1", "BOLD");
    expect(r.ok).toBe(true);
    const spec = render.mock.calls[0][0];
    expect(spec).toMatchObject({ layout: "BOLD", headline: `${stored.headline} ${n}`, kicker: stored.kicker });
  });

  it("returns a small webp tile", async () => {
    const r = await renderLayoutPreview("c1", "a1", "HEADLINE");
    if (!r.ok) throw new Error(r.error);
    const meta = await sharp(r.webp).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 216, height: 270 });
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
    expect(render).not.toHaveBeenCalled();
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
    render.mockRejectedValueOnce(new CoverFitError("too long"));
    const r = await renderLayoutPreview("c1", "a1", "BOLD");
    expect(r.ok).toBe(true);
    expect(render.mock.calls.length).toBe(2);
    expect(render.mock.calls[1][0].layout).toBe("BOLD");
  });

  it("reports a fit failure when nothing fits", async () => {
    render.mockRejectedValue(new CoverFitError("too long"));
    expect(await renderLayoutPreview("c1", "a1", "BOLD")).toMatchObject({ ok: false, status: 422 });
  });

  it("reuses a tile it already drew for the same words", async () => {
    await renderLayoutPreview("c1", "a1", "SWISS");
    await renderLayoutPreview("c1", "a1", "SWISS");
    expect(render).toHaveBeenCalledTimes(1);
  });
});
