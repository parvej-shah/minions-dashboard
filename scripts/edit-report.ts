/**
 * How much authors rewrite drafts before publishing (research follow-up,
 * 2026-10-28). Read-only. Counts drafts created since <since>, when the first
 * draft started being kept; one with no kept first draft went out as written.
 *
 *   npm run edits:report                      # every workspace, since 2026-10-28
 *   npm run edits:report -- 2026-11-01 <client_id>
 */
import { prisma } from "@/lib/prisma";
import { editShare } from "@/lib/drafts/editShare";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};

(async () => {
  const since = new Date(process.argv[2] || "2026-10-28");
  const clientId = process.argv[3];
  const assets = await prisma.asset.findMany({
    where: { createdAt: { gte: since }, status: "PUBLISHED", ...(clientId && { clientId }) },
    select: { clientId: true, content: true, linkedinVariant: true, firstContent: true, firstLinkedin: true },
  });

  const byClient = new Map<string, { body: number[]; linkedin: number[] }>();
  for (const a of assets) {
    const row = byClient.get(a.clientId ?? "?") ?? { body: [], linkedin: [] };
    row.body.push(a.firstContent === null ? 0 : editShare(a.firstContent, a.content));
    if (a.linkedinVariant) row.linkedin.push(a.firstLinkedin === null ? 0 : editShare(a.firstLinkedin, a.linkedinVariant));
    byClient.set(a.clientId ?? "?", row);
  }

  console.log(`Published drafts created since ${since.toISOString().slice(0, 10)}: ${assets.length}`);
  for (const [id, r] of byClient) {
    const untouched = r.body.filter((x) => x === 0).length;
    console.log(
      `${id}  drafts ${r.body.length}  untouched ${untouched}  median rewrite: body ${pct(median(r.body))}` +
        (r.linkedin.length ? `, LinkedIn ${pct(median(r.linkedin))}` : "")
    );
  }
  await prisma.$disconnect();
})();
