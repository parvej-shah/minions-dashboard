import { prisma } from "@/lib/prisma";
import { toMemoryDTO } from "@/lib/mappers/author";
import { parseDisclosure, parseMemoryContent, parseMemoryKind } from "@/lib/authorInput";
import { blockingCodeFindings, checkMemory } from "@/lib/ai/memoryCheck";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_MEMORY_ITEMS } from "@/constants/contentLanes";
import { usageCounts } from "@/services/memoryUsage";
import type { JsonObject } from "@/server/http/body";
import { badRequest, HttpError, notFound } from "@/server/http/errors";

const CHECKS_PER_MINUTE = 30;
const DISCLOSURE_MESSAGE = "disclosure must be PUBLIC or GENERALIZE.";

// Confidential material is never stored (decision D4), even when the page's own check was skipped.
function savableContent(value: unknown): string {
  const content = parseMemoryContent(value);
  if (typeof content !== "string") throw badRequest(content.error);
  const blocked = blockingCodeFindings(content);
  if (blocked.length) throw badRequest(`Remove this before saving: ${blocked[0].reason}`);
  return content;
}

function requiredDisclosure(value: unknown) {
  const disclosure = parseDisclosure(value);
  if (!disclosure) throw badRequest(DISCLOSURE_MESSAGE);
  return disclosure;
}

export async function listMemory(clientId: string) {
  const rows = await prisma.professionalMemory.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } });
  const counts = await usageCounts(clientId, rows.map((row) => row.id));
  return rows.map((row) => toMemoryDTO(row, counts.get(row.id) ?? 0));
}

export async function createMemory(clientId: string, body: JsonObject) {
  const kind = parseMemoryKind(body.kind);
  if (!kind) throw badRequest("Pick what kind of experience this is.");
  const disclosure = requiredDisclosure(body.disclosure);
  const content = savableContent(body.content);

  const count = await prisma.professionalMemory.count({ where: { clientId } });
  if (count >= MAX_MEMORY_ITEMS) throw badRequest(`You have ${MAX_MEMORY_ITEMS} items, the limit. Remove old ones first.`);

  return toMemoryDTO(await prisma.professionalMemory.create({ data: { clientId, kind, content, disclosure, source: "BRAND_PAGE" } }));
}

export async function updateMemory(clientId: string, id: string, body: JsonObject) {
  const existing = await prisma.professionalMemory.findFirst({ where: { id, clientId } });
  if (!existing) throw notFound("Experience item not found");

  const data: { kind?: string; content?: string; disclosure?: string; isActive?: boolean } = {};
  if (body.kind !== undefined) {
    const kind = parseMemoryKind(body.kind);
    if (!kind) throw badRequest("Unknown experience kind.");
    data.kind = kind;
  }
  if (body.disclosure !== undefined) data.disclosure = requiredDisclosure(body.disclosure);
  if (body.content !== undefined) data.content = savableContent(body.content);
  if (body.is_active !== undefined) data.isActive = body.is_active === true;

  const updated = await prisma.professionalMemory.update({ where: { id }, data });
  const counts = await usageCounts(clientId, [id]);
  return toMemoryDTO(updated, counts.get(id) ?? 0);
}

export async function deleteMemory(clientId: string, id: string) {
  const { count } = await prisma.professionalMemory.deleteMany({ where: { id, clientId } });
  if (!count) throw notFound("Experience item not found");
}

export async function checkMemoryDraft(clientId: string, body: JsonObject) {
  const { allowed } = await checkRateLimit(`memory-check:${clientId}`, CHECKS_PER_MINUTE, 60);
  if (!allowed) throw new HttpError(429, "Too many checks in a minute. Try again shortly.");

  const content = parseMemoryContent(body.content);
  if (typeof content !== "string") throw badRequest(content.error);
  return checkMemory(content, requiredDisclosure(body.disclosure));
}
