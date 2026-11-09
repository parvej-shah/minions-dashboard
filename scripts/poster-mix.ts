/**
 * Which poster type each of a workspace's posts would get, read-only. Reads
 * the shape of every post (src/lib/prompts/posterShape.ts, cached in
 * .poster-mix-cache.json so a re-run costs nothing), then replays the picker
 * oldest first, with and without an author photo. Writes nothing to the
 * database.
 *
 *   npx tsx --env-file=.env.local scripts/poster-mix.ts <client_id> [--fresh] [--render <dir>]
 *
 * --render draws every post as the type it gets (with the workspace's real
 * photo when it can fill a Photo poster) into <dir>, numbered oldest first,
 * plus contact sheets. Nothing is uploaded.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { coverBrand } from "@/lib/covers/brand";
import { renderCoverPng } from "@/lib/covers/render";
import { CoverFitError, type CoverSpec } from "@/lib/covers/layouts";
import { eligibleTypes, fallbackOrder } from "@/lib/covers/posterType";
import { dataUrlFitsPoster } from "@/lib/covers/photo";
import { hostedCoverPhoto, defaultByline } from "@/services/cover";
import { prisma } from "@/lib/prisma";
import { chatWithFallback } from "@/lib/ai/modelChain";
import { renderPosterShape } from "@/lib/prompts/posterShape";
import { parseShape, shapeJson, type PosterShape } from "@/lib/covers/shape";
import { pickPosterType } from "@/lib/covers/posterType";
import type { CoverLayout } from "@/lib/covers/layouts";

const CACHE = ".poster-mix-cache.json";

(async () => {
  const clientId = process.argv[2];
  if (!clientId) throw new Error("Usage: poster-mix.ts <client_id> [--fresh]");
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY is not set");
  const cache: Record<string, { raw: unknown }> = existsSync(CACHE) && !process.argv.includes("--fresh") ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

  const assets = await prisma.asset.findMany({
    where: { clientId, followUpOf: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, content: true, linkedinVariant: true, coverSpec: true },
  });
  const profile = await prisma.brandProfile.findUnique({ where: { clientId } });
  const photo = profile ? await hostedCoverPhoto(profile) : undefined;
  const photoUsable = dataUrlFitsPoster(photo);
  console.log(`Author photo: ${photo ? (photoUsable ? "usable for a Photo poster" : "found, but can't fill a Photo poster") : "none hosted"}`);

  type Stored = { layout?: string; headline?: string; emphasis?: string; kicker?: string; quote?: string; number?: { value: string; unit?: string } };
  const rows: { id: string; title: string; shape: PosterShape; notes: string[]; judged: { number?: boolean; quote?: boolean }; cover: Stored }[] = [];
  for (const a of assets) {
    const post = a.linkedinVariant?.trim() || a.content;
    if (!cache[a.id]) {
      const res = await chatWithFallback(renderPosterShape({ title: a.title, post }), apiKey);
      cache[a.id] = { raw: res.status < 300 ? shapeJson(res.body) : null };
      writeFileSync(CACHE, JSON.stringify(cache, null, 1));
    }
    const notes: string[] = [];
    const shape = parseShape(cache[a.id].raw, `${a.content}\n${a.linkedinVariant ?? ""}`, notes);
    // A stored Number or Quote cover was judged to stand on its own when it was drawn.
    const layout = (a.coverSpec as { layout?: string } | null)?.layout;
    rows.push({ id: a.id, title: a.title, shape, notes, judged: { number: layout === "NUMBER", quote: layout === "QUOTE" }, cover: (a.coverSpec ?? {}) as Stored });
  }

  const renderDir = process.argv.includes("--render") ? process.argv[process.argv.indexOf("--render") + 1] : null;
  const runs = renderDir ? [photoUsable] : [false, true];
  for (const photoOk of runs) {
    const recent: string[] = [];
    const picks: CoverLayout[] = [];
    console.log(`\n=== ${photoOk ? "WITH a photo" : "WITHOUT a photo (as today)"} ===`);
    for (const r of rows) {
      const input = { shape: r.shape, judged: r.judged, photoOk, recent };
      let t = pickPosterType(input);
      if (renderDir && profile) t = await drawPoster(renderDir, picks.length + 1, r, fallbackOrder(t, eligibleTypes(input)), profile, photo);
      picks.push(t);
      recent.unshift(t);
      const has = [r.shape.list && "list", r.shape.grid && "grid", r.shape.punch && "punch", r.shape.own_story && "story"].filter(Boolean).join(",");
      console.log(`${t.padEnd(9)} [${has.padEnd(22)}] ${r.title.slice(0, 70)}`);
    }
    const counts = picks.reduce<Record<string, number>>((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {});
    const repeats = picks.filter((t, i) => i > 0 && picks[i - 1] === t).length;
    console.log("mix:", Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n} (${Math.round((n / picks.length) * 100)}%)`).join(", "), `| repeats in a row: ${repeats}`);
  }
  if (renderDir) console.log(`\nPosters written to ${renderDir}/`);
  const dropped = rows.flatMap((r) => r.notes);
  if (dropped.length) console.log("\nDropped parts:\n- " + dropped.join("\n- "));
  await prisma.$disconnect();
})();

/** Draws one post as the first type in order whose copy fits; returns the type drawn. */
async function drawPoster(
  dir: string,
  n: number,
  r: { title: string; shape: PosterShape; cover: { headline?: string; emphasis?: string; kicker?: string; quote?: string; number?: { value: string; unit?: string }; layout?: string } },
  order: CoverLayout[],
  profile: { brandName: string; coverByline: string | null; positioning: string | null; primaryInk: string | null; brandCream: string | null; brandCoral: string | null; brandTeal: string | null },
  photo: string | undefined
): Promise<CoverLayout> {
  mkdirSync(dir, { recursive: true });
  const { brand } = coverBrand({ ink: profile.primaryInk, paper: profile.brandCream, accent: profile.brandCoral, secondary: profile.brandTeal });
  const author = { name: profile.brandName, role: profile.coverByline?.trim() || defaultByline(profile.positioning ?? ""), photo };
  // A stored Number cover's headline is the figure's caption; other types use the title-like headline.
  const headline = r.cover.layout === "NUMBER" || r.cover.layout === "QUOTE" ? r.title : (r.cover.headline ?? r.title);
  for (const layout of order) {
    const own = layout === r.cover.layout;
    const spec: CoverSpec = {
      layout,
      headline: own ? (r.cover.headline ?? r.title) : headline,
      emphasis: own || r.cover.layout !== "NUMBER" ? r.cover.emphasis : undefined,
      kicker: layout === "HEADLINE" || layout === "STATEMENT" ? r.cover.kicker : undefined,
      quote: r.cover.quote,
      number: r.cover.number,
      list: r.shape.list?.items,
      grid: r.shape.grid?.items,
      punch: r.shape.punch,
      author,
      brand,
    };
    for (const s of [spec, { ...spec, kicker: undefined }, { ...spec, headline: r.title, emphasis: undefined, kicker: undefined }]) {
      try {
        const png = await renderCoverPng(s);
        writeFileSync(join(dir, `${String(n).padStart(2, "0")}-${layout}.png`), png);
        return layout;
      } catch (e) {
        if (!(e instanceof CoverFitError)) throw e;
      }
    }
  }
  return "HEADLINE";
}
