/**
 * The sample pictures the Studio's cover layout and carousel design pickers
 * show (tasks/41.md): every layout and every design drawn once with demo
 * copy and the default brand, so a reviewer sees what a choice looks like
 * before picking it. No database, no upload: it writes files only.
 *
 *   npx tsx scripts/picker-thumbs.ts
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { COVER_LAYOUTS, type CoverLayout, type CoverSpec } from "@/lib/covers/layouts";
import { renderCoverPng } from "@/lib/covers/render";
import { prepareCutout } from "@/lib/covers/photo";
import { renderSlidePng } from "@/lib/carousel/render";
import { SLIDE_STYLES, type Deck, type Slide } from "@/lib/carousel/slides";
import { PICKER_THUMB_DIR } from "@/lib/covers/pickerThumbs";

const OUT = join("public", PICKER_THUMB_DIR);
const brand = DEFAULT_COVER_BRAND;
const TILE = { width: 216, height: 270 };

const mascot = readFileSync("public/images/mascots/rex.png");

(async () => {
  mkdirSync(OUT, { recursive: true });
  const opaque = await sharp(mascot).flatten({ background: "#cfe3e0" }).resize(900, 900).jpeg().toBuffer();
  const author = { name: "Sam Rivera", role: "Founder, Northwind Studio", photo: `data:image/jpeg;base64,${opaque.toString("base64")}` };
  const cutout = await prepareCutout(mascot);

  const base: Omit<CoverSpec, "layout"> = {
    headline: "Clients buy clarity, not hours",
    emphasis: "clarity",
    kicker: "What changed when we stopped selling time",
    label: "For service founders",
    quote: "Nobody ever bought a proposal because it was long.",
    number: { value: "3x", unit: "more replies" },
    list: ["Name the outcome", "Price the result", "Show one proof", "Ask for the call"],
    grid: [
      { label: "Scope", icon: "TARGET" },
      { label: "Price", icon: "CHART_BAR" },
      { label: "Proof", icon: "SEAL_CHECK" },
      { label: "Follow-up", icon: "CLOCK" },
    ] as CoverSpec["grid"],
    punch: { lines: ["Long proposals.", "Slow replies.", "Lost deals."], checks: ["One page", "One price", "One next step"] },
    cutout,
    author,
    brand,
  };

  const failed: string[] = [];
  for (const layout of COVER_LAYOUTS as readonly CoverLayout[]) {
    try {
      const png = await renderCoverPng({ ...base, layout });
      await sharp(png).resize(TILE.width, TILE.height).webp({ quality: 82 }).toFile(join(OUT, `cover-${layout.toLowerCase()}.webp`));
    } catch (e) {
      failed.push(`${layout}: ${(e as Error).message}`);
    }
  }

  // A carousel design shows in its inner pages (the cover is the post's own), so two sit side by side.
  const slides: Slide[] = [
    { layout: "POINT", title: "Name the outcome first", body: "Lead with what the client gets, then how.", emphasis: "outcome" },
    { layout: "CHECKLIST", title: "Before you send it", items: ["One page", "One price", "One next step"] },
    { layout: "CLOSE", takeaway: "Sell the result, not the hours.", saveLine: "Save this for your next proposal." },
  ];
  for (const style of SLIDE_STYLES) {
    try {
      const deck: Deck = { cover: { ...base, layout: "STATEMENT" }, slides, label: "Proposals", author, brand, style };
      const w = 150;
      const h = 188;
      const pages = await Promise.all([1, 2].map(async (i) => sharp(await renderSlidePng(deck, i)).resize(w, h).png().toBuffer()));
      const rounded = await Promise.all(
        pages.map((p) =>
          sharp(p)
            .composite([{ input: Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="10" ry="10"/></svg>`), blend: "dest-in" }])
            .png()
            .toBuffer()
        )
      );
      await sharp({ create: { width: 320, height: TILE.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(rounded.map((input, n) => ({ input, left: 5 + n * (w + 10), top: Math.round((TILE.height - h) / 2) })))
        .webp({ quality: 82 })
        .toFile(join(OUT, `carousel-${style.toLowerCase()}.webp`));
    } catch (e) {
      failed.push(`${style}: ${(e as Error).message}`);
    }
  }

  console.log(failed.length ? `Not drawn:\n${failed.join("\n")}` : `All samples written to ${OUT}/`);
})();
