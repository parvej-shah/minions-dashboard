/**
 * Phase 6 exit check (docs/product/authority-flywheel-plan.md): has a tenant
 * answered the weekly question two weeks in a row, and does at least one
 * harvested idea rest on a note saved from an answer?
 *
 *   npm run pulse:report                 # tenant zero
 *   npm run pulse:report -- <client_id>
 */
import { prisma } from "@/lib/prisma";

(async () => {
  const clientId = process.argv[2] || "tenant-zero-getminions-ai";
  const pulses = await prisma.weeklyPulse.findMany({ where: { clientId }, orderBy: { weekStart: "desc" }, take: 8 });
  const memories = await prisma.professionalMemory.findMany({ where: { clientId, source: "WEEKLY_PULSE" }, select: { id: true, content: true } });
  const ids = memories.map((m) => m.id);
  const ideas = ids.length
    ? await prisma.idea.findMany({ where: { clientId, memoryIds: { hasSome: ids } }, select: { id: true, rawIdea: true, memoryIds: true, createdAt: true } })
    : [];

  // Consecutive answered weeks, newest first.
  let streak = 0;
  let expected: number | null = null;
  for (const p of pulses) {
    const t = p.weekStart.getTime();
    if (p.status !== "ANSWERED" || (expected !== null && t !== expected)) break;
    streak++;
    expected = t - 7 * 86_400_000;
  }

  console.log(`Tenant ${clientId}`);
  for (const p of pulses) console.log(`  week of ${p.weekStart.toISOString().slice(0, 10)}  ${p.status.padEnd(9)} ${p.memoryIds.length} note(s)`);
  console.log(`Weekly notes saved: ${memories.length}`);
  console.log(`Ideas resting on a weekly note: ${ideas.length}`);
  for (const i of ideas.slice(0, 5)) console.log(`  ${i.id}  ${String(i.rawIdea ?? "").slice(0, 100)}`);
  const pass = streak >= 2 && ideas.length >= 1;
  console.log(`\nAnswered weeks in a row: ${streak}. Exit ${pass ? "MET" : "not met yet"} (needs 2 in a row and 1 idea).`);
  await prisma.$disconnect();
})();
