import { createHash } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { CoverFitError, type CoverLayout, type CoverSpec } from "@/lib/covers/layouts";
import { needsFallbackGlyphs, renderCoverPng, renderCoverSvg } from "@/lib/covers/render";
import { dataUrlFitsPoster } from "@/lib/covers/photo";
import { editAttempts, posterParts, switchLayout } from "@/lib/covers/layoutSwitch";
import type { PosterShape } from "@/lib/covers/shape";
import type { Template } from "@/lib/covers/custom/parse";
import type { StoredCoverSpec } from "@/services/cover";
import { coverCutout, hostedCoverPhoto } from "@/services/cover";

/**
 * One tile for the Studio's layout picker: the post's own words drawn in
 * another layout by the real cover renderer, shrunk to picker size. It reads
 * the stored cover and brand and writes nothing: no upload, no row update, no
 * model call, so a tile costs only a render.
 */

/** 2.5x the 84 px tile, the same size as the static sample pictures. */
const TILE = { width: 216, height: 270 };

/**
 * A tile is the cover's SVG, which the browser draws (tasks/58.md): laying a
 * cover out takes 20-60 ms, rasterizing it took up to 2 s. Words our fonts
 * lack take the old raster path, a small webp.
 */
export type TileType = "image/svg+xml" | "image/webp";
export type PreviewResult = { ok: true; body: Buffer; type: TileType } | { ok: false; error: string; status: 404 | 422 };

// Tiles already drawn by this instance, by what they were drawn from. A tile is
// a few KB; the browser caches too, this covers a reload or a second reviewer.
const MAX_TILES = 120;
const tiles = new Map<string, { body: Buffer; type: TileType }>();
const remember = (key: string, tile: { body: Buffer; type: TileType }) => {
  tiles.set(key, tile);
  if (tiles.size > MAX_TILES) tiles.delete(tiles.keys().next().value as string);
};

/**
 * A tile shows at 84 px wide, so twice the tile's own size is plenty for the
 * headshot or cut-out it embeds; the full photo made every tile hundreds of KB.
 * Only the picture inside the tile shrinks: the real cover keeps the full photo.
 */
const TILE_PHOTO_PX = 2 * TILE.width;
export async function shrinkDataUrl(dataUrl: string | undefined, px = TILE_PHOTO_PX): Promise<string | undefined> {
  const m = dataUrl?.match(/^data:([^;,]+);base64,(.*)$/);
  if (!m) return dataUrl;
  try {
    const img = sharp(Buffer.from(m[2], "base64"));
    const { width = 0, hasAlpha } = await img.metadata();
    if (width <= px) return dataUrl;
    const resized = img.resize({ width: px });
    const out = hasAlpha ? await resized.png().toBuffer() : await resized.jpeg({ quality: 82 }).toBuffer();
    return `data:image/${hasAlpha ? "png" : "jpeg"};base64,${out.toString("base64")}`;
  } catch {
    return dataUrl;
  }
}

// The headshot as a data URL, read once a minute per photo rather than per tile.
const PHOTO_TTL_MS = 60_000;
const photos = new Map<string, { at: number; photo: Promise<string | undefined> }>();
const tilePhotos = new Map<string, { at: number; photo: Promise<string | undefined> }>();
function photoFor(clientId: string, profile: Parameters<typeof hostedCoverPhoto>[0]): Promise<string | undefined> {
  const key = `${clientId}:${profile.primaryLogoUrl}:${profile.coverPhotoUrl ?? ""}`;
  const hit = photos.get(key);
  if (hit && Date.now() - hit.at < PHOTO_TTL_MS) return hit.photo;
  tilePhotos.delete(key);
  const photo = hostedCoverPhoto(profile).catch(() => undefined);
  photos.set(key, { at: Date.now(), photo });
  if (photos.size > 20) photos.delete(photos.keys().next().value as string);
  return photo;
}

/** The headshot shrunk for tiles, made once per photo read. */
function tilePhotoFor(clientId: string, profile: Parameters<typeof hostedCoverPhoto>[0], full: Promise<string | undefined>): Promise<string | undefined> {
  const key = `${clientId}:${profile.primaryLogoUrl}:${profile.coverPhotoUrl ?? ""}`;
  const hit = tilePhotos.get(key);
  if (hit && Date.now() - hit.at < PHOTO_TTL_MS) return hit.photo;
  const photo = full.then(shrinkDataUrl);
  tilePhotos.set(key, { at: Date.now(), photo });
  if (tilePhotos.size > 20) tilePhotos.delete(tilePhotos.keys().next().value as string);
  return photo;
}

/** design: the saved design a CUSTOM tile is drawn in, already read from the workspace's own rows. */
export async function renderLayoutPreview(clientId: string, assetId: string, layout: CoverLayout, design?: { id: string; version: number; template: Template }): Promise<PreviewResult> {
  if (layout === "CUSTOM" && !design) return { ok: false, error: "That design is no longer in your workspace.", status: 404 };
  // One round trip: the brand row does not depend on the asset.
  const [asset, profile] = await Promise.all([
    prisma.asset.findUnique({ where: { id: assetId }, select: { id: true, clientId: true, title: true, content: true, linkedinVariant: true, coverSpec: true } }),
    prisma.brandProfile.findUnique({ where: { clientId } }),
  ]);
  if (!asset || asset.clientId !== clientId) return { ok: false, error: "Asset not found", status: 404 };
  const stored = asset.coverSpec as Partial<StoredCoverSpec> | null;
  if (!stored?.headline || !stored.layout || !stored.brand) return { ok: false, error: "This post has no cover yet", status: 404 };

  const fullPhoto = profile ? photoFor(clientId, profile) : Promise.resolve(undefined);
  const photo = await fullPhoto;
  const shape = (stored.card as { shape?: PosterShape } | undefined)?.shape;
  const photoOk = dataUrlFitsPoster(photo);
  const wantsCutout = layout === "CUTOUT" || (layout === "CUSTOM" && Boolean(design?.template.slots.includes("cutout")));
  const fullCutout = wantsCutout && profile ? await coverCutout(profile) : undefined;
  const cutout = fullCutout && { ...fullCutout, src: (await shrinkDataUrl(fullCutout.src)) ?? fullCutout.src };
  // Whether the photo can fill a Photo cover is judged on the full photo; the tile draws the small one.
  const tilePhoto = profile && photo ? await tilePhotoFor(clientId, profile, fullPhoto) : undefined;

  const base: CoverSpec = {
    layout: stored.layout,
    label: stored.label,
    headline: stored.headline,
    emphasis: stored.emphasis,
    kicker: stored.kicker,
    quote: stored.quote,
    number: stored.number,
    author: { name: stored.author?.name ?? "", role: stored.author?.role, photo: tilePhoto },
    brand: stored.brand,
    art: stored.art,
    ...posterParts(shape),
  };
  const switched = design
    ? ({ ok: true, spec: { ...base, layout: "CUSTOM", custom: design } } as const)
    : switchLayout(base, layout, { shape, photo: { present: Boolean(photo), ok: photoOk }, cutout: Boolean(cutout), body: asset.content ?? "", post: asset.linkedinVariant });
  if (!switched.ok) return { ok: false, error: switched.error, status: 422 };
  const spec: CoverSpec = { ...switched.spec, cutout };

  // The photo and cut-out are the same for every tile of one brand, so they stay out of the key; a design is named by id and version.
  const custom = spec.custom && { id: spec.custom.id, version: spec.custom.version };
  const key = createHash("sha1").update(JSON.stringify({ ...spec, custom, author: { ...spec.author, photo: Boolean(photo) }, cutout: Boolean(cutout) })).digest("hex");
  const cached = tiles.get(key);
  if (cached) return { ok: true, ...cached };

  const raster = needsFallbackGlyphs(spec);
  for (const attempt of editAttempts(spec, asset.title ?? "")) {
    try {
      const tile = raster
        ? { body: await sharp(await renderCoverPng(attempt)).resize(TILE.width, TILE.height).webp({ quality: 78 }).toBuffer(), type: "image/webp" as const }
        : { body: Buffer.from(await renderCoverSvg(attempt)), type: "image/svg+xml" as const };
      remember(key, tile);
      return { ok: true, ...tile };
    } catch (e) {
      if (!(e instanceof CoverFitError)) throw e;
    }
  }
  return { ok: false, error: "That wording does not fit this layout", status: 422 };
}
