import { createHash } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { CoverFitError, type CoverLayout, type CoverSpec } from "@/lib/covers/layouts";
import { renderCoverPng } from "@/lib/covers/render";
import { dataUrlFitsPoster } from "@/lib/covers/photo";
import { editAttempts, posterParts, switchLayout } from "@/lib/covers/layoutSwitch";
import type { PosterShape } from "@/lib/covers/shape";
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

export type PreviewResult = { ok: true; webp: Buffer } | { ok: false; error: string; status: 404 | 422 };

// Tiles already drawn by this instance, by what they were drawn from. A tile is
// a few KB; the browser caches too, this covers a reload or a second reviewer.
const MAX_TILES = 120;
const tiles = new Map<string, Buffer>();
const remember = (key: string, webp: Buffer) => {
  tiles.set(key, webp);
  if (tiles.size > MAX_TILES) tiles.delete(tiles.keys().next().value as string);
};

// The headshot as a data URL, read once a minute per photo rather than per tile.
const PHOTO_TTL_MS = 60_000;
const photos = new Map<string, { at: number; photo: Promise<string | undefined> }>();
function photoFor(clientId: string, profile: Parameters<typeof hostedCoverPhoto>[0]): Promise<string | undefined> {
  const key = `${clientId}:${profile.primaryLogoUrl}:${profile.coverPhotoUrl ?? ""}`;
  const hit = photos.get(key);
  if (hit && Date.now() - hit.at < PHOTO_TTL_MS) return hit.photo;
  const photo = hostedCoverPhoto(profile).catch(() => undefined);
  photos.set(key, { at: Date.now(), photo });
  if (photos.size > 20) photos.delete(photos.keys().next().value as string);
  return photo;
}

export async function renderLayoutPreview(clientId: string, assetId: string, layout: CoverLayout): Promise<PreviewResult> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true, clientId: true, title: true, content: true, linkedinVariant: true, coverSpec: true } });
  if (!asset || asset.clientId !== clientId) return { ok: false, error: "Asset not found", status: 404 };
  const stored = asset.coverSpec as Partial<StoredCoverSpec> | null;
  if (!stored?.headline || !stored.layout || !stored.brand) return { ok: false, error: "This post has no cover yet", status: 404 };

  const profile = await prisma.brandProfile.findUnique({ where: { clientId } });
  const photo = profile ? await photoFor(clientId, profile) : undefined;
  const shape = (stored.card as { shape?: PosterShape } | undefined)?.shape;
  const photoOk = dataUrlFitsPoster(photo);
  const cutout = layout === "CUTOUT" && profile ? await coverCutout(profile) : undefined;

  const base: CoverSpec = {
    layout: stored.layout,
    label: stored.label,
    headline: stored.headline,
    emphasis: stored.emphasis,
    kicker: stored.kicker,
    quote: stored.quote,
    number: stored.number,
    author: { name: stored.author?.name ?? "", role: stored.author?.role, photo },
    brand: stored.brand,
    art: stored.art,
    ...posterParts(shape),
  };
  const switched = switchLayout(base, layout, { shape, photo: { present: Boolean(photo), ok: photoOk }, cutout: Boolean(cutout), body: asset.content ?? "", post: asset.linkedinVariant });
  if (!switched.ok) return { ok: false, error: switched.error, status: 422 };
  const spec: CoverSpec = { ...switched.spec, cutout };

  // The photo and cut-out are the same for every tile of one brand, so they stay out of the key.
  const key = createHash("sha1").update(JSON.stringify({ ...spec, author: { ...spec.author, photo: Boolean(photo) }, cutout: Boolean(cutout) })).digest("hex");
  const cached = tiles.get(key);
  if (cached) return { ok: true, webp: cached };

  for (const attempt of editAttempts(spec, asset.title ?? "")) {
    try {
      const png = await renderCoverPng(attempt);
      const webp = await sharp(png).resize(TILE.width, TILE.height).webp({ quality: 78 }).toBuffer();
      remember(key, webp);
      return { ok: true, webp };
    } catch (e) {
      if (!(e instanceof CoverFitError)) throw e;
    }
  }
  return { ok: false, error: "That wording does not fit this layout", status: 422 };
}
