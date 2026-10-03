import { prisma } from "@/lib/prisma";
import { assertSafeFetchTarget } from "@/lib/ssrf-guard";
import {
  IDEA_SOURCE_KINDS,
  MAX_ITEMS_PER_SOURCE,
  MAX_SOURCES_PER_TENANT,
  resolveSourceFeedUrl,
  type IdeaSourceKind,
} from "@/constants/ideaSources";
import { toIdeaSourceDTO } from "@/lib/mappers/ideaSource";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";

const DEFAULT_MAX_ITEMS = 5;

const clampMaxItems = (value: unknown) => Math.min(Math.max(Number(value) || DEFAULT_MAX_ITEMS, 1), MAX_ITEMS_PER_SOURCE);

async function assertFeedTarget(source: { kind: IdeaSourceKind; url: string | null; query: string | null }) {
  const feedUrl = resolveSourceFeedUrl(source);
  if (!feedUrl) throw badRequest("Could not build a feed URL from that input.");
  await assertSafeFetchTarget(feedUrl).catch((error) => {
    throw badRequest(error instanceof Error ? error.message : "That URL is not reachable.");
  });
}

export async function listIdeaSources(clientId: string) {
  const rows = await prisma.ideaSource.findMany({ where: { clientId }, orderBy: { createdAt: "asc" } });
  return rows.map(toIdeaSourceDTO);
}

export async function createIdeaSource(clientId: string, body: JsonObject) {
  const kind = (asString(body.kind) || "RSS") as IdeaSourceKind;
  const label = asString(body.label);
  const url = asString(body.url) || null;
  const query = asString(body.query) || null;

  const kindDef = IDEA_SOURCE_KINDS.find((candidate) => candidate.id === kind);
  if (!kindDef) throw badRequest("Unknown source kind.");
  if (!label) throw badRequest("label is required");
  if (kindDef.usesQuery && !query) throw badRequest(`A ${kindDef.label} needs a topic.`);
  if (!kindDef.usesQuery && !url) throw badRequest(`A ${kindDef.label} needs a feed URL.`);

  const count = await prisma.ideaSource.count({ where: { clientId } });
  if (count >= MAX_SOURCES_PER_TENANT) {
    throw badRequest(`You have reached the limit of ${MAX_SOURCES_PER_TENANT} sources. Remove one before adding another.`);
  }

  await assertFeedTarget({ kind, url, query });

  const maxItems = clampMaxItems(body.max_items);
  const created = await prisma.ideaSource.create({
    data: { clientId, kind, label, url, query, maxItems, isActive: body.is_active !== false },
  });
  return toIdeaSourceDTO(created);
}

export async function updateIdeaSource(clientId: string, id: string, body: JsonObject) {
  const existing = await prisma.ideaSource.findFirst({ where: { id, clientId } });
  if (!existing) throw notFound("Source not found");

  const kind = (body.kind !== undefined ? String(body.kind) : existing.kind) as IdeaSourceKind;
  const url = body.url !== undefined ? asString(body.url) || null : existing.url;
  const query = body.query !== undefined ? asString(body.query) || null : existing.query;
  if (!IDEA_SOURCE_KINDS.some((candidate) => candidate.id === kind)) throw badRequest("Unknown source kind.");

  const fetchTargetChanged = body.kind !== undefined || body.url !== undefined || body.query !== undefined;
  if (fetchTargetChanged) await assertFeedTarget({ kind, url, query });

  const updated = await prisma.ideaSource.update({
    where: { id },
    data: {
      kind,
      url,
      query,
      ...(body.label !== undefined ? { label: asString(body.label) || existing.label } : {}),
      ...(body.max_items !== undefined ? { maxItems: clampMaxItems(body.max_items) } : {}),
      ...(body.is_active !== undefined ? { isActive: body.is_active === true } : {}),
      ...(body.url !== undefined || body.query !== undefined ? { lastError: null } : {}),
    },
  });
  return toIdeaSourceDTO(updated);
}

export async function deleteIdeaSource(clientId: string, id: string) {
  const { count } = await prisma.ideaSource.deleteMany({ where: { id, clientId } });
  if (count === 0) throw notFound("Source not found");
}
