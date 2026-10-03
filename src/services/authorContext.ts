import { prisma } from "@/lib/prisma";
import { DEFAULT_LANES, defaultLaneId, type LanePurpose, type MemoryDisclosure, type MemoryKind, type ProfileTarget } from "@/constants/contentLanes";

/**
 * Who the author writes for (ICP), what they have lived (memory), and what
 * they publish (lanes): the inputs the authority-first harvester is built on
 * (docs/product/authority-flywheel-plan.md, phase 1). Served to n8n through
 * GET /api/brand/context.
 */

export interface IcpContext {
  who: string;
  role: string;
  company_type: string;
  pains: string[];
  decisions: string[];
  questions: string[];
  buying_triggers: string[];
  vocabulary: string[];
}

export interface MemoryContext {
  id: string;
  kind: MemoryKind;
  content: string;
  /**
   * GENERALIZE: the author allows the lesson but not the specifics. Prompts
   * must not name the client, place, or figures from it.
   */
  disclosure: MemoryDisclosure;
  used_count: number;
  /** From a weekly answer in the last PULSE_FRESH_DAYS days: the next harvest builds on it first. */
  fresh?: boolean;
}

export interface LaneContext {
  id: string;
  name: string;
  purpose: LanePurpose;
  brief: string;
  weight: number;
  profile_target: ProfileTarget;
}

export interface AuthorContext {
  icp: IcpContext;
  memory: MemoryContext[];
  lanes: LaneContext[];
}

export const EMPTY_ICP: IcpContext = {
  who: "",
  role: "",
  company_type: "",
  pains: [],
  decisions: [],
  questions: [],
  buying_triggers: [],
  vocabulary: [],
};

/** Memory sent per harvest, most useful first. Keeps the prompt bounded. */
export const MEMORY_LIMIT = 40;

type IcpRow = {
  who: string;
  role: string;
  companyType: string;
  pains: string[];
  decisions: string[];
  questions: string[];
  buyingTriggers: string[];
  vocabulary: string[];
};
type MemoryRow = { id: string; kind: string; content: string; disclosure: string; usedCount: number; source?: string; createdAt?: Date };

/** How long a weekly-answer item counts as new this week (phase 6). */
const PULSE_FRESH_DAYS = 14;
type LaneRow = { id: string; name: string; purpose: string; brief: string; weight: number; profileTarget: string };

export function toIcpContext(row: IcpRow | null): IcpContext {
  if (!row) return EMPTY_ICP;
  return {
    who: row.who,
    role: row.role,
    company_type: row.companyType,
    pains: row.pains,
    decisions: row.decisions,
    questions: row.questions,
    buying_triggers: row.buyingTriggers,
    vocabulary: row.vocabulary,
  };
}

export function toMemoryContext(row: MemoryRow, now = Date.now()): MemoryContext {
  const fresh = row.source === "WEEKLY_PULSE" && !!row.createdAt && now - row.createdAt.getTime() < PULSE_FRESH_DAYS * 86_400_000;
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    content: row.content,
    disclosure: row.disclosure as MemoryDisclosure,
    used_count: row.usedCount,
    ...(fresh ? { fresh: true } : {}),
  };
}

function toLaneContext(row: LaneRow): LaneContext {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose as LanePurpose,
    brief: row.brief,
    weight: row.weight,
    profile_target: row.profileTarget as ProfileTarget,
  };
}

/**
 * Gives a tenant the default lanes and an ICP row if it has none. Tenants that
 * existed at the 2026-09-23 migration were seeded there; this covers every
 * tenant created since, from whichever signup path, at the moment its context
 * is first needed. The ICP starts from the AUDIENCE directive onboarding wrote.
 * Idempotent (deterministic ids + skipDuplicates).
 */
export async function ensureAuthorDefaults(clientId: string): Promise<void> {
  const [laneCount, icp] = await Promise.all([
    prisma.contentLane.count({ where: { clientId } }),
    prisma.icpProfile.findUnique({ where: { clientId }, select: { id: true } }),
  ]);

  if (laneCount === 0) {
    await prisma.contentLane.createMany({
      data: DEFAULT_LANES.map((l) => ({
        id: defaultLaneId(clientId, l.slug),
        clientId,
        name: l.name,
        purpose: l.purpose,
        brief: l.brief,
        weight: l.weight,
        sortOrder: l.sortOrder,
      })),
      skipDuplicates: true,
    });
  }

  if (!icp) {
    const audience = await prisma.brandDirective.findMany({
      where: { clientId, isActive: true, category: "AUDIENCE", audienceScope: { in: ["ALL", "ICP"] } },
      orderBy: [{ priority: "asc" }, { updatedAt: "asc" }],
      select: { instruction: true },
    });
    await prisma.icpProfile.createMany({
      data: [{ id: `ICP-${clientId}`, clientId, who: audience.map((d) => d.instruction).join(" ") }],
      skipDuplicates: true,
    });
  }
}

export async function getAuthorContext(clientId: string): Promise<AuthorContext> {
  await ensureAuthorDefaults(clientId);
  const [icp, memory, lanes] = await Promise.all([
    prisma.icpProfile.findUnique({ where: { clientId } }),
    prisma.professionalMemory.findMany({
      where: { clientId, isActive: true },
      // Least-used first, so the harvester reaches for experience it has not
      // leaned on yet; newest first among equals.
      orderBy: [{ usedCount: "asc" }, { createdAt: "desc" }],
      take: MEMORY_LIMIT,
    }),
    prisma.contentLane.findMany({
      where: { clientId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return { icp: toIcpContext(icp), memory: memory.map((m) => toMemoryContext(m)), lanes: lanes.map(toLaneContext) };
}
