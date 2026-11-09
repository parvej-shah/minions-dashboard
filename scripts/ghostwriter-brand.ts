/**
 * ONE-OFF (2026-11-09): turn the parvejshalabib007s-workspace into the
 * workspace that markets Minions Ghostwriter (this product), instead of the
 * real-estate voice AI. The user posts by hand from it.
 *
 *   npx tsx --env-file=.env.local scripts/ghostwriter-brand.ts
 *
 * Reversible: old directives and experience items are deactivated, not
 * deleted, and the full prior state is written to backups/ (gitignored)
 * before anything changes. Aborts without writing if the workspace is not
 * the expected one. Every fact below comes from docs/decisions/DECISIONS.md
 * or the product itself; nothing claims customers or customer results.
 */
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { saveIcp } from "@/services/icp";
import { newDirectiveId } from "@/services/brandDirectives";
import { parseMemoryContent } from "@/lib/authorInput";
import { blockingCodeFindings } from "@/lib/ai/memoryCheck";

const CLIENT = "cmvkvuq3k000008lb120ib2ei";
const SLUG = "parvejshalabib007s-workspace";

const PROFILE = {
  companyDomain: "https://minions.getminions.ai",
  positioning:
    "I'm building Minions Ghostwriter. It writes LinkedIn posts for founders and consultants in their own voice, from their own experience: it finds ideas in their work, drafts each post with a cover or carousel, checks every claim, and waits for their review. The promise is three things together: you post every week, it sounds like you, and it takes little of your time.",
  coverByline: "Founder, Minions Ghostwriter",
  toneFormality: "conversational_peer",
  toneCadence: "1-3 sentence paragraphs, plain language, first person, no filler.",
  allowedProofClaims: [] as string[],
};

const ICP = {
  who: "A founder or consultant who runs a small B2B service business and wins clients through their own LinkedIn presence, but posts rarely because client work comes first and AI drafts don't sound like them.",
  role: "Founder, managing partner or independent consultant",
  company_type: "B2B service firms, agencies and consultancies, 1-20 people",
  buyer: "OUTCOME",
  pains: [
    "I know I should post every week, but client work always comes first.",
    "I open LinkedIn, stare at the empty box and close it again.",
    "AI drafts sound like everyone else's, so I rewrite them or don't post at all.",
    "When I go quiet for a month, the inbound conversations dry up.",
    "A ghostwriter costs a lot and still needs hours of calls to learn my voice.",
  ],
  decisions: [
    "Write posts myself, hire a ghostwriter, or use an AI tool.",
    "How often to post without it eating into client work.",
    "Whether to let a tool publish for me or review every post first.",
  ],
  questions: [
    "Will it sound like me or like ChatGPT?",
    "How much of my time does it take each week?",
    "Will it make up numbers or client stories under my name?",
    "Can I check every post before it goes out?",
    "What do I have to give it to get started?",
  ],
  buying_triggers: [
    "A competitor who posts every week keeps getting the referrals.",
    "A slow month in the pipeline.",
    "Realising their last post was months ago.",
    "A post that did well, and no idea how to do it again.",
  ],
  vocabulary: ["posting consistently", "in my own voice", "inbound", "pipeline", "referrals", "sounds like AI", "ghostwriter"],
};

const DIRECTIVES: { category: string; key: string; instruction: string }[] = [
  { category: "TOPICS", key: "consistent_posting", instruction: "I write about posting on LinkedIn every week as a busy founder or consultant: why people go quiet, what silence costs them in inbound and referrals, and how to keep the habit without it taking over the week." },
  { category: "TOPICS", key: "your_own_voice", instruction: "I write about sounding like yourself when AI helps you write: why most AI drafts read as generic, and what makes a post recognisably yours (your stories, your numbers, your opinions)." },
  { category: "TOPICS", key: "building_in_public", instruction: "I write about building Minions Ghostwriter in public: what we tried, what our own data showed, and what we changed because of it." },
  { category: "POSITIONING", key: "core_promise", instruction: "Minions Ghostwriter's promise is three things together: you post on LinkedIn every week, the posts sound like you, and it takes little of your time. Every post about the product ties back to one of these." },
  { category: "POSITIONING", key: "your_experience_your_review", instruction: "Posts come from the author's own experience (their work, stories, opinions and lessons), not from generic news, and nothing goes out until the author has reviewed it." },
  { category: "POSITIONING", key: "no_invented_claims", instruction: "Every factual claim in a draft is checked against what the author gave us, and anything unverified is flagged before publishing, so a post never invents a client, a number or a result." },
  { category: "POSITIONING", key: "soft_call_to_action", instruction: "When a post invites the reader to try it, use one soft line at the end: Minions Ghostwriter is free for 14 days with no card needed, at minions.getminions.ai. Not every post needs it." },
  { category: "VOICE", key: "founder_building_in_public", instruction: "I write as the founder building the product: first person, plain words, short paragraphs. I share our real numbers and our mistakes, not hype." },
  { category: "VOICE", key: "no_hype", instruction: "No hype words (revolutionary, game-changing, unlock, supercharge, 10x) and no engagement bait such as 'comment YES' or 'agree?'." },
  { category: "FORBIDDEN", key: "no_customer_claims", instruction: "Never claim Minions Ghostwriter has paying customers, a number of users, or customer results unless an experience item states them." },
  { category: "FORBIDDEN", key: "no_growth_promises", instruction: "Never promise that posts will go viral, bring leads or be undetectable as AI." },
];
// Kept: FORBIDDEN no_invented_metrics (true for any product).
const KEEP_RULE_KEYS = new Set(["no_invented_metrics", "icp_profile"]);

const MEMORIES: { kind: string; content: string }[] = [
  { kind: "CURRENT_WORK", content: "I'm building Minions Ghostwriter, which writes LinkedIn posts for founders and consultants in their own voice. It finds ideas in their own experience, drafts the post with a cover image or carousel, checks every factual claim, and waits for their review before anything goes out." },
  { kind: "CURRENT_WORK", content: "Minions Ghostwriter started as the tool that writes the LinkedIn posts for our own voice AI company, Minions.AI. We used it on our own page first, before anyone else did." },
  { kind: "BUILD_IN_PUBLIC", content: "In September 2026 the posts Minions wrote for our own LinkedIn got a median of 85 impressions, against 179 for the profile's other posts. LinkedIn rewards posts people stop and read, and generic AI phrasing loses that. So we rebuilt the writer to speak as the author in first person, and to check every draft for AI patterns like 'it isn't X, it's Y' and the closing one-line maxim. A draft that still reads like a template gets one rewrite." },
  { kind: "LESSON", content: "Our own data on 28 October 2026: only 2 workspaces had ever answered the weekly question, and 42 of 75 drafts were sitting unreviewed. People don't stop posting for lack of ideas. Reviewing felt like another task. So the weekly question became one line you type and press Enter, and the Studio now shows one draft at a time." },
  { kind: "EXPERIMENT", content: "We hand-labelled 166 claims from real drafts. The model that wrote the drafts called 28 checkable claims 'opinions', so they would have gone out unchecked. A small separate classifier made that mistake 6 times, in about 0.3 seconds per draft. Now the classifier decides which sentences need checking, and a figure or customer result with no source is flagged before you can publish." },
  { kind: "LESSON", content: "People told us the Brand page felt like old-style forms that took hours to fill in. Setup now reads your LinkedIn PDF and your website instead, and you watch your profile, audience, experience and voice appear. You only remove or fix what's wrong, and nothing is saved until you say it looks right." },
  { kind: "OPINION", content: "Founders rarely go quiet on LinkedIn for lack of ideas. Our user research kept coming back to three causes together: no time, the blank page, and drafts that don't sound like them. Fix one and the other two still stop you, which is why the product is built around all three." },
  { kind: "LESSON", content: "Seven of our workspaces had none of the author's own material, so their drafts came from news and sounded generic. A person's voice lives in what they have already written, and pasting two or three old posts is less work than answering questions. So a workspace with no material of its own now asks for exactly that." },
  { kind: "BUILD_IN_PUBLIC", content: "I rated our early covers 7 out of 10. The headline was 7 to 8 words, too long to read in the second a feed thumbnail gets. Now the cover carries a 3 to 6 word line written from the finished post, and it replaces the headline only when it says more, so no cover gets worse." },
  { kind: "STORY", content: "I added an idea from my own work, with my real reach numbers in the notes, and the draft came back as a story about a made-up real estate brokerage. My numbers were gone. That day we changed the rule: an idea you add yourself is written as your own first-hand account, and the draft may claim nothing beyond your notes." },
  { kind: "OPINION", content: "A tool that posts under your name without your review is a liability. One invented number or client story costs more trust than a month of silence. That's why every Minions draft waits for the author, and every unverified claim is flagged before publishing." },
  { kind: "BUILD_IN_PUBLIC", content: "A Minions draft takes about 80 seconds: one step picks the angle, one writes the post, one checks every claim, one writes the LinkedIn, Facebook and X versions, and the cover is drawn in your brand's colours in about a second. We dropped AI-generated cover images entirely; covers are drawn in code from your brand." },
];
// Kept: the three PAST_EXPERIENCE items (the author's career, true for any product).

async function main() {
  const client = await prisma.client.findUnique({ where: { id: CLIENT } });
  if (client?.slug !== SLUG) throw new Error(`workspace ${CLIENT} is not ${SLUG}`);

  for (const m of MEMORIES) {
    const ok = parseMemoryContent(m.content);
    if (typeof ok !== "string") throw new Error(`memory invalid: ${ok.error} :: ${m.content.slice(0, 60)}`);
    const blocked = blockingCodeFindings(m.content);
    if (blocked.length) throw new Error(`memory blocked: ${blocked[0].reason} :: ${m.content.slice(0, 60)}`);
  }

  const before = {
    profile: await prisma.brandProfile.findUnique({ where: { clientId: CLIENT } }),
    icp: await prisma.icpProfile.findUnique({ where: { clientId: CLIENT } }),
    directives: await prisma.brandDirective.findMany({ where: { clientId: CLIENT } }),
    memories: await prisma.professionalMemory.findMany({ where: { clientId: CLIENT } }),
    lanes: await prisma.contentLane.findMany({ where: { clientId: CLIENT } }),
    ideas: await prisma.idea.findMany({ where: { clientId: CLIENT }, select: { id: true, status: true } }),
  };
  fs.mkdirSync("backups", { recursive: true });
  const snap = `backups/ghostwriter-brand-before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(snap, JSON.stringify(before, null, 2));
  console.log("snapshot written:", snap);

  const oldDirectives = before.directives.filter((d) => d.isActive && !KEEP_RULE_KEYS.has(d.ruleKey)).map((d) => d.id);
  const oldMemories = before.memories.filter((m) => m.isActive && m.kind !== "PAST_EXPERIENCE").map((m) => m.id);
  const unusedIdeas = before.ideas.filter((i) => i.status === "REFINED" || i.status === "HARVESTED").map((i) => i.id);
  const questionnaire = { ...((before.profile?.toneQuestionnaire as Record<string, unknown>) ?? {}), signature_phrases: [] };

  await prisma.$transaction([
    prisma.brandDirective.updateMany({ where: { clientId: CLIENT, id: { in: oldDirectives } }, data: { isActive: false } }),
    prisma.professionalMemory.updateMany({ where: { clientId: CLIENT, id: { in: oldMemories } }, data: { isActive: false } }),
    // The real-estate ideas nobody drafted yet would otherwise be drafted first.
    prisma.idea.updateMany({ where: { clientId: CLIENT, id: { in: unusedIdeas } }, data: { status: "DISCARDED" } }),
    prisma.brandProfile.update({ where: { clientId: CLIENT }, data: { ...PROFILE, toneQuestionnaire: questionnaire } }),
    prisma.contentLane.updateMany({ where: { clientId: CLIENT, name: "Build in Public" }, data: { weight: 2 } }),
    prisma.brandDirective.createMany({
      data: DIRECTIVES.map((d) => ({ id: newDirectiveId(), clientId: CLIENT, category: d.category, ruleKey: d.key, instruction: d.instruction, priority: 1, audienceScope: "ALL", isActive: true })),
    }),
    prisma.professionalMemory.createMany({
      data: MEMORIES.map((m) => ({ clientId: CLIENT, kind: m.kind, content: m.content, disclosure: "PUBLIC", source: "BRAND_PAGE" })),
    }),
  ]);
  // Through the service, so the AUDIENCE directive is rewritten exactly as the Brand page would.
  await saveIcp(CLIENT, ICP);

  console.log(`deactivated ${oldDirectives.length} directives, ${oldMemories.length} experience items; set aside ${unusedIdeas.length} unused ideas`);
  const active = await prisma.brandDirective.groupBy({ by: ["category"], where: { clientId: CLIENT, isActive: true }, _count: true });
  console.log("active directives:", active.map((a) => `${a.category}=${a._count}`).join(" "));
  console.log("active experience:", await prisma.professionalMemory.count({ where: { clientId: CLIENT, isActive: true } }));
  const audience = await prisma.brandDirective.findFirst({ where: { clientId: CLIENT, category: "AUDIENCE", isActive: true } });
  console.log("audience:", audience?.instruction.slice(0, 160));
}

main()
  .catch((e) => {
    console.error("ABORTED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
