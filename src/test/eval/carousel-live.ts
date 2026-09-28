/**
 * Plans and renders a real carousel from one stored draft (phase 11), for a
 * manual post before the review screen and publisher exist. Reads the
 * database, calls the model, writes files. Stores nothing, posts nothing.
 *
 *   npx tsx --env-file=.env.local src/test/eval/carousel-live.ts --asset <id> --out <dir>
 */
import fs from "node:fs";
import path from "node:path";
import { arg } from "./llm";
import { planOnly } from "@/services/carousel";
import { renderCarouselPdf, renderSlidePng } from "@/lib/carousel/render";
import { prisma } from "@/lib/prisma";

async function main() {
  const assetId = arg("asset", "");
  if (!assetId) throw new Error("--asset <id> is required");
  const outDir = arg("out", path.join(process.cwd(), "src/test/eval/results/carousel-live"));
  const result = await planOnly(assetId);
  if (!result.ok) {
    console.error(result.error);
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }
  const { plan, deck } = result;
  fs.mkdirSync(outDir, { recursive: true });
  const pngs: Buffer[] = [];
  for (let i = 0; i <= deck.slides.length; i++) {
    const png = await renderSlidePng(deck, i);
    pngs.push(png);
    fs.writeFileSync(path.join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`), png);
  }
  const pdf = await renderCarouselPdf(deck, pngs);
  fs.writeFileSync(path.join(outDir, "carousel.pdf"), pdf);
  fs.writeFileSync(path.join(outDir, "caption.txt"), plan.caption + "\n");
  fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify({ asset: assetId, model: result.model, attempts: result.attempts, ...plan }, null, 2) + "\n");
  console.log(`${plan.structure}: ${pngs.length} slides, ${result.attempts} attempt(s), ${result.model}, PDF ${Math.round(pdf.length / 1024)} KB`);
  console.log(`Document title: ${plan.documentTitle}`);
  console.log(`Written to ${outDir}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
