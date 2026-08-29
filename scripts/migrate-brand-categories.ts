/**
 * One-off migration: remaps existing BrandDirective.category values from the
 * old 17-value taxonomy to the new 5-value one (POSITIONING/TOPICS/AUDIENCE/
 * VOICE/FORBIDDEN). Run once, manually, against prod after deploying the
 * category-consolidation change. Not part of app runtime.
 *
 * Usage: npx tsx scripts/migrate-brand-categories.ts [--dry-run]
 */
import { prisma } from "@/lib/prisma";

const CATEGORY_MAP: Record<string, string> = {
  IDENTITY: "POSITIONING",
  ICP_PROFILE: "AUDIENCE",
  ICP_PAIN: "AUDIENCE",
  POSITIONING: "POSITIONING",
  PROOF: "POSITIONING",
  OBJECTION: "POSITIONING",
  PEER_STANCE: "AUDIENCE",
  BRAND_PERSONA: "POSITIONING",
  CONTENT_THEMES: "TOPICS",
  TOPICS: "TOPICS",
  AUDIENCE_LANES: "AUDIENCE",
  AUDIENCE: "AUDIENCE",
  EDITORIAL_PHILOSOPHY: "VOICE",
  VOICE_DO: "VOICE",
  VOICE_DONT: "VOICE",
  VOICE: "VOICE",
  CONTENT_RULES: "VOICE",
  WRITING_STYLE: "VOICE",
  CTA: "VOICE",
  FORBIDDEN: "FORBIDDEN",
  // Legacy values briefly emitted by an earlier version of the onboarding
  // Brand Copilot before it matched the real BrandCategory enum.
  EDITORIAL_PILLARS: "POSITIONING",
  VOICE_AND_STYLE: "VOICE",
  SAFETY_GUARDRAILS: "FORBIDDEN",
  // Legacy values found in some seeded/manually-created rows.
  TARGET_AUDIENCE: "AUDIENCE",
  VOICE_STYLE: "VOICE",
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const rows = await prisma.brandDirective.findMany({
    where: { category: { not: "DISTRIBUTION" } },
    select: { id: true, category: true },
  });

  const toUpdate = rows.filter((r) => CATEGORY_MAP[r.category] && CATEGORY_MAP[r.category] !== r.category);
  const unmapped = rows.filter((r) => !CATEGORY_MAP[r.category] && r.category !== "DISTRIBUTION");

  console.log(`${rows.length} directive rows scanned, ${toUpdate.length} need remapping.`);
  if (unmapped.length) {
    console.warn(`${unmapped.length} rows have an unrecognized category and were left untouched:`, unmapped);
  }

  if (dryRun) {
    for (const row of toUpdate) {
      console.log(`  ${row.id}: ${row.category} -> ${CATEGORY_MAP[row.category]}`);
    }
    console.log("Dry run only, no writes made.");
    return;
  }

  for (const row of toUpdate) {
    await prisma.brandDirective.update({
      where: { id: row.id },
      data: { category: CATEGORY_MAP[row.category] },
    });
  }

  console.log(`Updated ${toUpdate.length} rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
