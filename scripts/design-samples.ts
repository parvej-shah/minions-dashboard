/**
 * Local design samples for review (tasks/9.md): real bsse1610 carousels redrawn
 * in the POSTER style, opening with the post's own cover, next to the same deck
 * in its stored style; plus the experimental banner designs (covers/modern.tsx)
 * on real headlines. Read-only: nothing is written to the database and
 * nothing is uploaded.
 *
 *   npx tsx --env-file=.env.local scripts/design-samples.ts [out-dir]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { coverBrand } from "@/lib/covers/brand";
import type { CoverSpec } from "@/lib/covers/layouts";
import type { PosterShape } from "@/lib/covers/shape";
import { parsePlan, toDeck, type CarouselPlan } from "@/lib/carousel/plan";
import { renderSlidePng } from "@/lib/carousel/render";
import type { Deck, Slide } from "@/lib/carousel/slides";
import { BANNER_DESIGNS } from "@/lib/covers/modern";
import { renderCoverPng } from "@/lib/covers/render";
import { prepareCutout } from "@/lib/covers/photo";
import { hostedCoverPhoto, defaultByline } from "@/services/cover";

const CLIENT = "cmtvi4a7r000104l5kn6bi71o";
const OUT = process.argv[2] ?? "poster-samples/2026-11-09-design";

/** The decks to redraw, and what each shows off. */
const DECKS: { id: string; why: string; extra?: (plan: CarouselPlan, shape?: PosterShape) => Slide[] }[] = [
  {
    id: "f0dd48fd-0938-4a9a-887c-8a6d3e8201b4",
    why: "Punch cover as page 1; a run of points with giant numerals; the post's own punch lines as a PUNCH slide",
    // The post's punch lines, read from the post when its cover was drawn, as their own page before the close.
    extra: (plan, shape) => (shape?.punch ? [...plan.slides.slice(0, -1).slice(0, 4), { layout: "PUNCH", lines: shape.punch.lines, checks: shape.punch.checks }, plan.slides[plan.slides.length - 1]] : plan.slides),
  },
  {
    id: "d14be2ab-a115-4edf-b758-c711004e5ad2",
    why: "Split contrast page, highlighted key words, checklist",
  },
  { id: "336e72e9-a97e-41cc-903f-e3a044289678", why: "A STEP sequence riding the ribbon" },
];

async function strip(pngs: Buffer[], file: string) {
  const w = 360;
  const h = 450;
  const tiles = await Promise.all(pngs.map((p) => sharp(p).resize(w, h).png().toBuffer()));
  await sharp({ create: { width: w * tiles.length, height: h, channels: 3, background: "#ffffff" } })
    .composite(tiles.map((input, i) => ({ input, left: i * w, top: 0 })))
    .png()
    .toFile(file);
}

async function grid(pngs: Buffer[], file: string, cols = 4) {
  const w = 360;
  const h = 450;
  const gap = 16;
  const rows = Math.ceil(pngs.length / cols);
  const tiles = await Promise.all(pngs.map((p) => sharp(p).resize(w, h).png().toBuffer()));
  await sharp({ create: { width: cols * w + (cols + 1) * gap, height: rows * h + (rows + 1) * gap, channels: 3, background: "#e9e7e3" } })
    .composite(tiles.map((input, i) => ({ input, left: gap + (i % cols) * (w + gap), top: gap + Math.floor(i / cols) * (h + gap) })))
    .png()
    .toFile(file);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const profile = await prisma.brandProfile.findUnique({ where: { clientId: CLIENT } });
  if (!profile) throw new Error("No brand profile");
  const { brand } = coverBrand({ ink: profile.primaryInk, paper: profile.brandCream, accent: profile.brandCoral, secondary: profile.brandTeal });
  const author = { name: profile.brandName, role: profile.coverByline?.trim() || defaultByline(profile.positioning ?? ""), photo: await hostedCoverPhoto(profile) };

  for (const [n, d] of DECKS.entries()) {
    const asset = await prisma.asset.findUnique({ where: { id: d.id }, select: { title: true, coverSpec: true, carouselSpec: true } });
    const stored = (asset?.carouselSpec as { plan?: unknown } | null)?.plan;
    if (!asset || !stored) {
      console.log(`skip ${d.id}: no carousel`);
      continue;
    }
    const plan = parsePlan(JSON.stringify(stored)).plan!;
    const coverRaw = asset.coverSpec as (CoverSpec & { card?: { shape?: PosterShape } }) | null;
    const shape = coverRaw?.card?.shape;
    const cover: CoverSpec | undefined = coverRaw ? { ...coverRaw, author, brand, list: shape?.list?.items, grid: shape?.grid?.items, punch: shape?.punch } : undefined;
    const slides = d.extra ? d.extra(plan, shape) : plan.slides;
    const dir = join(OUT, `deck-${n + 1}`);
    mkdirSync(dir, { recursive: true });

    for (const style of ["POSTER", plan.style] as const) {
      const built = toDeck({ ...plan, style, slides: style === "POSTER" ? slides : plan.slides }, { author, brand, cover });
      if (built.errors.length) console.log(`deck ${n + 1} ${style}: ${built.errors.join(" | ")}`);
      const deck: Deck = built.deck;
      const pngs: Buffer[] = [];
      for (let i = 0; i <= deck.slides.length; i++) {
        try {
          pngs.push(await renderSlidePng(deck, i));
        } catch (e) {
          console.log(`deck ${n + 1} ${style} page ${i + 1}: ${(e as Error).message}`);
        }
      }
      const tag = style === "POSTER" ? "new-POSTER" : `old-${style}`;
      if (style === "POSTER") pngs.forEach((p, i) => writeFileSync(join(dir, `${String(i + 1).padStart(2, "0")}.png`), p));
      await strip(pngs, join(dir, `strip-${tag}.png`));
    }
    console.log(`deck ${n + 1}: ${asset.title.slice(0, 70)} — ${d.why}`);
  }

  // The new slide layouts on their own, light and dark, with short demo copy about deck 2's post (its checklist items are too long for tiles).
  {
    const demo: Slide[] = [
      { layout: "STAKES", statement: "A booking only counts once it lands in the calendar.", emphasis: "calendar" },
      { layout: "GRID", title: "What a real booking touches", items: [{ label: "Calendar slot", icon: "CALENDAR_BLANK" }, { label: "CRM record", icon: "DATABASE" }, { label: "Agent alert", icon: "LIGHTNING" }, { label: "Buyer reminder", icon: "CLOCK" }] },
      { layout: "GRID", title: "Check before you trust it", items: [{ label: "Latency", icon: "HOURGLASS" }, { label: "Write-back", icon: "DATABASE" }, { label: "Fallback", icon: "LIFEBUOY" }, { label: "Alerts", icon: "WARNING" }, { label: "Logs", icon: "FILE_TEXT" }, { label: "Owner", icon: "KEY" }] },
      { layout: "PUNCH", lines: ["The voice sounded human.", "The buyer said yes.", "The calendar stayed empty."], checks: ["Write before you confirm", "Alert a human on failure", "Test with real phones"] },
      { layout: "NUMBER", value: "3", unit: "seconds", caption: "of silence and a live caller hangs up." },
      { layout: "CLOSE", takeaway: "Judge a voice agent by the calendar, not the call.", saveLine: "Save this for your next demo." },
    ];
    const deck: Deck = { cover: { layout: "STATEMENT", headline: "What a real booking touches", author, brand }, slides: demo, label: "Demo copy", author, brand, style: "POSTER" };
    const dir = join(OUT, "layouts-demo-copy");
    mkdirSync(dir, { recursive: true });
    const pngs: Buffer[] = [];
    for (let i = 1; i <= demo.length; i++) pngs.push(await renderSlidePng(deck, i));
    pngs.forEach((p, i) => writeFileSync(join(dir, `${String(i + 2).padStart(2, "0")}-${demo[i].layout}.png`), p));
    await strip(pngs, join(dir, "strip.png"));
  }

  // Banners: every design on real headlines from recent drafts.
  const recent = await prisma.asset.findMany({ where: { clientId: CLIENT, followUpOf: null }, orderBy: { createdAt: "desc" }, take: 14, select: { title: true, coverSpec: true, hook: true } });
  const heads = recent
    .map((a) => {
      const c = (a.coverSpec ?? {}) as { headline?: string; emphasis?: string; kicker?: string };
      return { headline: c.headline || a.title, emphasis: c.emphasis, kicker: c.kicker || a.hook || undefined };
    })
    .filter((h) => h.headline);
  // A stand-in cut-out for the sample: the headshot in an arch, see-through around it (a real one is uploaded on the Brand page).
  let cutout: CoverSpec["cutout"];
  if (author.photo) {
    const head = Buffer.from(author.photo.split(",")[1], "base64");
    const arch = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000"><path d="M0 1000 V350 A350 350 0 0 1 700 350 V1000 Z" fill="#fff"/></svg>`);
    const shaped = await sharp(head).resize(700, 1000, { fit: "cover" }).composite([{ input: arch, blend: "dest-in" }]).png().toBuffer();
    cutout = await prepareCutout(await sharp({ create: { width: 800, height: 1100, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: shaped, left: 50, top: 100 }]).png().toBuffer());
  }
  const bdir = join(OUT, "banners");
  mkdirSync(bdir, { recursive: true });
  const banners: Buffer[] = [];
  for (const [i, design] of BANNER_DESIGNS.entries()) {
    // Two headlines per design, so each is seen with different copy.
    for (const h of [heads[i % heads.length], heads[(i + 5) % heads.length]]) {
      // Through the production path: a cover spec in the banner's layout, as the cover service draws it.
      const spec: CoverSpec = { layout: design, headline: h.headline, emphasis: h.emphasis, kicker: h.kicker, author, brand, cutout };
      try {
        const png = await renderCoverPng(spec);
        banners.push(png);
        writeFileSync(join(bdir, `${String(banners.length).padStart(2, "0")}-${design}.png`), png);
      } catch (e) {
        console.log(`banner ${design}: ${(e as Error).message}`);
      }
    }
  }
  if (banners.length) await grid(banners, join(OUT, "banners-sheet.png"));
  console.log(`\nSamples written to ${OUT}/`);
  await prisma.$disconnect();
})();
