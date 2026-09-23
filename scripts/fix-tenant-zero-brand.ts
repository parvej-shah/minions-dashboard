/**
 * ONE-OFF (2026-09-23): undo onboarding/voice-import TEST runs that were done
 * while signed in as tenant zero on 2026-08-29, which rewrote getminions.ai's
 * own brand with a test HVAC contractor's and "Studio Lumiere"'s.
 *
 *   npx tsx --env-file=.env.local scripts/fix-tenant-zero-brand.ts
 *
 * Reversible: directives are deactivated, not deleted, and the full prior
 * state is written to backups/ (gitignored) before anything changes. Aborts
 * without writing if the rows are not exactly as expected.
 */
import fs from "node:fs";
import { prisma } from "@/lib/prisma";

const CLIENT = "tenant-zero-getminions-ai";

const DEACTIVATE = [
  // 18:37 -- an HVAC contractor's voice-proof rules (trip fees, sizing, "cheapest")
  "DIR-mteq3kev-6af2d3", "DIR-mteq3kwu-d9aa6c", "DIR-mteq3lfu-9d3a81", "DIR-mteq3luj-a7eeaa", "DIR-mteq3m6y-22c6b9",
  // 19:14 -- "Studio Lumiere" onboarding (interior-design ICP, spatial voice-AI rules)
  "DIR-cda567f7-943d-4b32-900c-19b68ad2f825", "DIR-mterf2yo-dd8f84", "DIR-mterf3rh-5dc42c", "DIR-mterf43q-c1afad",
];

// Profile fields the 19:14 onboarding overwrote, restored from the
// 2026-08-26 backup (last state before the test run).
const RESTORE = {
  toneFormality: "tactile_operator",
  toneCadence: "1–3 sentence paragraphs, zero marketing fluff, Stripe/Linear engineering rigor",
  allowedProofClaims: [
    "Live callable AI voice dispatcher demo",
    "Deterministic JSON schema validation pipeline",
    "Sub-1.8s WebSocket voice turnaround latency",
    "Direct team engineering logs from Dhaka",
  ],
  primaryLogoUrl: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/minions_logo_primary.svg",
};

async function main() {
  const before = {
    directives: await prisma.brandDirective.findMany({ where: { clientId: CLIENT } }),
    profile: await prisma.brandProfile.findUnique({ where: { clientId: CLIENT } }),
  };
  fs.mkdirSync("backups", { recursive: true });
  const snap = `backups/tenant-zero-brand-before-fix-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(snap, JSON.stringify(before, null, 2));
  console.log("snapshot written:", snap);

  // The backup's positioning was ALSO a test value ("Facility directors and
  // commercial property managers..."), so use the tenant's own statement.
  const positioning = before.directives.find((d) => d.id === "DIR-002")?.instruction;
  if (!positioning?.startsWith("An AI operations partner")) throw new Error("DIR-002 is not as expected");
  const found = before.directives.filter((d) => DEACTIVATE.includes(d.id)).length;
  if (found !== DEACTIVATE.length) throw new Error(`expected ${DEACTIVATE.length} directives, found ${found}`);

  await prisma.$transaction([
    prisma.brandDirective.updateMany({ where: { clientId: CLIENT, id: { in: DEACTIVATE } }, data: { isActive: false } }),
    prisma.brandProfile.update({ where: { clientId: CLIENT }, data: { positioning, ...RESTORE } }),
  ]);

  const p = await prisma.brandProfile.findUnique({ where: { clientId: CLIENT } });
  const stillActive = await prisma.brandDirective.count({ where: { clientId: CLIENT, id: { in: DEACTIVATE }, isActive: true } });
  console.log(`deactivated ${DEACTIVATE.length - stillActive}/${DEACTIVATE.length} test directives`);
  console.log("positioning:", p?.positioning);
  console.log("formality:", p?.toneFormality, "| cadence:", p?.toneCadence);
  console.log("proof claims:", p?.allowedProofClaims.length, "| logo:", p?.primaryLogoUrl);
}

main()
  .catch((e) => {
    console.error("ABORTED, nothing changed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
