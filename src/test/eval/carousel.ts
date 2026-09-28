/**
 * Carousel render fixtures (phase 11). Draws fixed decks that use every slide
 * layout, as PNGs, one PDF per deck and a contact sheet, for a human look at
 * the design before any prompt work. No model is called; the copy is fixture
 * copy, never published.
 *
 *   npx tsx src/test/eval/carousel.ts [--out <dir>]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { arg } from "./llm";
import { chooseArt } from "@/lib/covers/art";
import { coverBrand, DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import type { CoverAuthor, CoverBrand } from "@/lib/covers/layouts";
import { renderCarouselPdf, renderSlidePng } from "@/lib/carousel/render";
import type { Deck } from "@/lib/carousel/slides";

const author: CoverAuthor = { name: "Parvej Shah", role: "Builds AI voice agents for real estate teams" };

function deck(id: string, brand: CoverBrand, d: Omit<Deck, "author" | "brand" | "cover"> & { headline: string; emphasis: string; kicker: string }): [string, Deck] {
  const art = chooseArt("SHAPES", d.headline, id);
  return [
    id,
    {
      label: d.label,
      slides: d.slides,
      author,
      brand,
      cover: { layout: "HEADLINE", label: "For real estate teams", headline: d.headline, emphasis: d.emphasis, kicker: d.kicker, author, brand, ...(art ? { art: { choice: art, seed: id } } : {}) },
    },
  ];
}

const DECKS: [string, Deck][] = [
  deck("booking-checks", DEFAULT_COVER_BRAND, {
    label: "Voice AI bookings",
    headline: "Your voice agent books showings your calendar never sees",
    emphasis: "never",
    kicker: "Five checks before you trust an AI with your showings.",
    slides: [
      { layout: "STAKES", statement: "The caller hears “you're booked”. The agent never gets the showing.", emphasis: "never", body: "By the time anyone notices, the lead has called the next brokerage." },
      { layout: "CONTRAST", before: "If the voice sounds human, the booking works.", after: "The booking works only if it lands in the calendar your agents actually use." },
      { layout: "POINT", title: "Confirm only after the calendar write succeeds", body: "Not when the caller says yes. When your calendar says the slot is taken.", emphasis: "after" },
      { layout: "POINT", title: "Read back the address and the time", body: "Two details, said once, catch most wrong bookings before they happen." },
      { layout: "POINT", title: "Hand off when the slot is not certain", body: "A warm transfer beats a confident wrong answer." },
      { layout: "CHECKLIST", title: "Before you switch it on", items: ["Test ten bookings end to end", "Watch the calendar, not the transcript", "Break the calendar on purpose once", "Give every failure a human fallback"] },
      { layout: "CLOSE", takeaway: "Judge a voice agent by the calendar, not by the call.", saveLine: "Save this for your next voice AI demo." },
    ],
  }),
  deck("rollout-steps", coverBrand({ ink: "#1b1f3b", paper: "#f5f3ee", accent: "#3b5bdb", secondary: "#2b2d6e" }).brand, {
    label: "Rolling out voice AI",
    headline: "Roll out a voice agent one lead source at a time",
    emphasis: "one",
    kicker: "The order matters more than the model.",
    slides: [
      { layout: "STEP", title: "Start with after-hours calls only", body: "They are the leads you lose today anyway." },
      { layout: "STEP", title: "Add weekend overflow once bookings hold", body: "Same script, more volume, same checks." },
      { layout: "STEP", title: "Only then put it on your main line", emphasis: "then" },
      { layout: "NUMBER", value: "3", unit: "seconds", caption: "A silent webhook timeout was all it took to lose a booking." },
      { layout: "QUOTE", quote: "The model was fine. The calendar write failed, and nothing told us.", attribution: "From our first rollout" },
      { layout: "CLOSE", takeaway: "Earn each new line with the one before it.", saveLine: "Save this for your rollout plan." },
    ],
  }),
];

async function main() {
  const outDir = arg("out", path.join(process.cwd(), "src/test/eval/results/carousel-fixtures"));
  fs.mkdirSync(outDir, { recursive: true });
  for (const [id, d] of DECKS) {
    const pngs: Buffer[] = [];
    for (let i = 0; i <= d.slides.length; i++) {
      const png = await renderSlidePng(d, i);
      pngs.push(png);
      fs.writeFileSync(path.join(outDir, `${id}-${String(i + 1).padStart(2, "0")}.png`), png);
    }
    const pdf = await renderCarouselPdf(d, pngs);
    fs.writeFileSync(path.join(outDir, `${id}.pdf`), pdf);
    // Contact sheet: every slide at a third of its size, in one row, as LinkedIn's swipe order.
    const w = 360, h = 450, gap = 16;
    const thumbs = await Promise.all(pngs.map((p) => sharp(p).resize(w, h).toBuffer()));
    await sharp({ create: { width: thumbs.length * (w + gap) + gap, height: h + gap * 2, channels: 3, background: "#d9d9d9" } })
      .composite(thumbs.map((input, i) => ({ input, left: gap + i * (w + gap), top: gap })))
      .png()
      .toFile(path.join(outDir, `${id}-sheet.png`));
    console.log(`${id}: ${pngs.length} slides, PDF ${Math.round(pdf.length / 1024)} KB`);
  }
  console.log(`Written to ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
