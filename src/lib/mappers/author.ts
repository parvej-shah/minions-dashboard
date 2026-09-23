import type { IcpProfile, ProfessionalMemory } from "@prisma/client";
import type { IcpProfileItem, MemoryItem } from "@/types/author";
import type { MemoryDisclosure, MemoryKind } from "@/constants/contentLanes";
import { EMPTY_ICP } from "@/services/authorContext";

export function toIcpDTO(row: IcpProfile | null): IcpProfileItem {
  if (!row) return { ...EMPTY_ICP, updated_at: null };
  return {
    who: row.who,
    role: row.role,
    company_type: row.companyType,
    pains: row.pains,
    decisions: row.decisions,
    questions: row.questions,
    buying_triggers: row.buyingTriggers,
    vocabulary: row.vocabulary,
    updated_at: row.updatedAt.toISOString(),
  };
}

export function toMemoryDTO(row: ProfessionalMemory, usedInIdeas = 0): MemoryItem {
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    content: row.content,
    disclosure: row.disclosure as MemoryDisclosure,
    source: row.source,
    is_active: row.isActive,
    used_in_ideas: usedInIdeas,
    created_at: row.createdAt.toISOString(),
  };
}
