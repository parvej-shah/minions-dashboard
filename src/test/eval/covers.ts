/**
 * Cover-copy eval (phase 5). Runs the strategist on the FIXED draft idea set
 * (draft-ideas.json) and scores each cover card in code with the same checks
 * the pipeline applies (src/lib/covers/copy.ts), against the stored phase 4
 * draft of the same idea for the figure and quote checks. Renders every cover
 * and a contact sheet for a human look. No image model is called.
 *
 *   npm run eval:covers -- --label baseline
 *   npm run eval:covers -- --rerender <results.json> --out <dir>   # re-apply the code to stored cards, no model call
 *   add --art SHAPES|DOODLES|NONE for the illustration style (default SHAPES)
 */
import fs from "node:fs";
import path from "node:path";
import { TENANTS } from "./corpus";
import { arg } from "./llm";
import { strategyOnce } from "./drafts";
import { chooseCoverCopy, type CoverCard, type CoverCopy } from "@/lib/covers/copy";
import { coverElement, CoverFitError, type CoverSpec } from "@/lib/covers/layouts";
import { renderCoverPng } from "@/lib/covers/render";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { chooseArt, parseArtStyle, DEFAULT_COVER_ART_STYLE } from "@/lib/covers/art";

type Json = Record<string, unknown>;
const IDEAS_FILE = path.join(process.cwd(), "src/test/eval/draft-ideas.json");
const RESULTS_DIR = path.join(process.cwd(), "src/test/eval/results");
const DRAFTS_FILE = path.join(RESULTS_DIR, "drafts-2026-09-23-phase4.json");

interface CoverRow {
  tenant: string;
  card: CoverCard;
  copy: CoverCopy;
  fits: boolean;
  /** The illustration chosen, whether its motif came from the post's words, and whether it stayed on the cover. */
  art?: { motif: string; by_keyword: boolean; drawn: boolean };
}

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

export function summarizeCovers(rows: CoverRow[]) {
  const n = rows.length;
  const count = (f: (r: CoverRow) => boolean) => pct(rows.filter(f).length, n);
  const words = rows.map((r) => r.copy.score.words);
  return {
    covers: n,
    strategist_headline_used: count((r) => r.copy.headline_source === "strategist"),
    words_6_to_10: count((r) => r.copy.score.length === 1),
    avg_words: n ? Math.round((10 * words.reduce((a, b) => a + b, 0)) / n) / 10 : 0,
    icp_relevant: count((r) => r.copy.score.icp_relevant),
    subtitle_usable: count((r) => Boolean(r.card.subtitle) && !r.copy.notes.some((x) => x.startsWith("Strategist subtitle"))),
    fits_first_try: count((r) => r.fits),
    // Of covers whose layout takes an illustration (HEADLINE, STATEMENT).
    art_drawn: pct(rows.filter((r) => r.art?.drawn).length, rows.filter((r) => r.art).length),
    art_by_keyword: pct(rows.filter((r) => r.art?.by_keyword).length, rows.filter((r) => r.art).length),
  };
}

/** The stored cards of an earlier run, by tenant and position, so a code change is judged on the same copy. */
function storedCards(file: string): Map<string, CoverCard> {
  const stored = JSON.parse(fs.readFileSync(file, "utf8")) as { rows: CoverRow[] };
  const seen: Record<string, number> = {};
  return new Map(stored.rows.map((r) => [`${r.tenant}-${(seen[r.tenant] = (seen[r.tenant] ?? 0) + 1)}`, r.card]));
}

async function main() {
  const rerender = arg("rerender", "");
  const label = rerender ? `${path.basename(rerender, ".json")}-rerender` : arg("label", "run");
  const outDir = arg("out", path.join(RESULTS_DIR, `covers-${label}`));
  fs.mkdirSync(outDir, { recursive: true });
  const cards = rerender ? storedCards(rerender) : null;
  const { ideas } = JSON.parse(fs.readFileSync(IDEAS_FILE, "utf8")) as { ideas: Record<string, Json[]> };
  const drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, "utf8")) as { tenants: Record<string, { drafts: { draft: { body: string; title: string; hook: string; claims_ok: string } }[] }> };
  const artStyle = parseArtStyle(arg("art", DEFAULT_COVER_ART_STYLE)) ?? DEFAULT_COVER_ART_STYLE;
  const rows: CoverRow[] = [];
  const recent: string[] = [];
  const recentMotifs: string[] = [];
  for (const tenant of TENANTS) {
    for (const [i, idea] of (ideas[tenant.id] ?? []).entries()) {
      const draft = drafts.tenants[tenant.id].drafts[i].draft;
      let card: CoverCard;
      let title = draft.title;
      if (cards) card = cards.get(`${tenant.id}-${i + 1}`) ?? {};
      else {
        const { strategy } = await strategyOnce(tenant, idea, i);
        const s = strategy.strategy as Json;
        card = (s.thumbnail_card ?? {}) as CoverCard;
        title = String(s.title ?? draft.title);
      }
      const copy = chooseCoverCopy({ card, title, hook: draft.hook, body: draft.body, claimsOk: draft.claims_ok, icp: { who: tenant.icp, role: "", company_type: "" }, recentLayouts: recent });
      recent.unshift(copy.layout);
      const spec: CoverSpec = { layout: copy.layout, headline: copy.headline, emphasis: copy.emphasis, kicker: copy.kicker, quote: copy.quote, number: copy.number, author: { name: tenant.settings.brand_name }, brand: DEFAULT_COVER_BRAND };
      const artText = [copy.headline, title, draft.hook].join(" ");
      const choice = copy.layout === "HEADLINE" || copy.layout === "STATEMENT" ? chooseArt(artStyle, artText, `${tenant.id}-${i}`, recentMotifs) : null;
      if (choice) {
        spec.art = { choice, seed: `${tenant.id}-${i}` };
        recentMotifs.unshift(choice.motif);
      }
      // As the service does: with the illustration, then without it, then without the subtitle.
      const tryFit = () => {
        try {
          coverElement(spec);
          return true;
        } catch (e) {
          if (!(e instanceof CoverFitError)) throw e;
          return false;
        }
      };
      let fits = tryFit();
      if (!fits && spec.art) {
        spec.art = undefined;
        fits = tryFit();
      }
      if (!fits) spec.kicker = undefined;
      const art = choice ? { motif: choice.motif, by_keyword: Boolean(choice.by_keyword), drawn: Boolean(spec.art) } : undefined;
      try {
        fs.writeFileSync(path.join(outDir, `${tenant.id}-${i + 1}.png`), await renderCoverPng(spec));
      } catch (e) {
        if (!(e instanceof CoverFitError)) throw e;
      }
      rows.push({ tenant: tenant.id, card, copy, fits, art });
      console.log(`${tenant.id} ${i + 1}: [${copy.layout}] ${copy.quote ?? copy.headline}${copy.notes.length ? `  (${copy.notes.join(" ")})` : ""}`);
    }
  }
  const result = { label, date: new Date().toISOString(), overall: summarizeCovers(rows), rows };
  const file = path.join(RESULTS_DIR, `covers-${result.date.slice(0, 10)}-${label}.json`);
  if (!rerender) fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  console.table(result.overall);
  console.log(rerender ? `rendered to ${outDir}` : `wrote ${path.relative(process.cwd(), file)} and ${outDir}`);
}

if (process.argv[1]?.endsWith("covers.ts")) main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exitCode = 1;
});
