import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkTemplate, type Preview } from "@/lib/covers/custom/check";
import { LIMITS } from "@/lib/covers/custom/contract";
import { parseTemplate, type Template } from "@/lib/covers/custom/parse";
import { readOnlyMine } from "@/lib/covers/custom/rotation";
import { HttpError } from "@/server/http/errors";
import { coverCutout, hostedCoverPhoto } from "@/services/cover";
import { shrinkDataUrl } from "@/services/coverPreview";

/**
 * A workspace's own cover designs (docs/research/cover-template-contract-2026-11-19.md).
 * Nothing is saved unless the pasted HTML passes the whole contract check, and
 * every read re-parses what is stored, so a row that was altered outside the
 * app still cannot reach the renderer. Every query is scoped by client_id.
 */

const CHECKS_PER_MINUTE = 12;
const SAVES_PER_MINUTE = 6;
/** A stored thumbnail larger than this is dropped; the design still saves. */
const MAX_PREVIEW_BYTES = 400 * 1024;

export interface TemplateSummary {
  id: string;
  name: string;
  version: number;
  slots: string[];
  preview_svg: string | null;
  created_at: string;
}

export type CheckOutcome = { ok: true; name: string; previews: Preview[]; stand_ins: ("photo" | "cutout")[] } | { ok: false; errors: string[] };

async function workspaceColours(clientId: string) {
  const p = await prisma.brandProfile.findUnique({ where: { clientId }, select: { primaryInk: true, brandCream: true, brandCoral: true, brandTeal: true } });
  return p ? { ink: p.primaryInk, paper: p.brandCream, accent: p.brandCoral, secondary: p.brandTeal } : undefined;
}

/** Wide enough for the 320 px preview at 2x, small enough to keep each preview light. */
const PREVIEW_PICTURE_PX = 640;

/**
 * The workspace's own headshot and cut-out for the check's previews: read
 * without copying or saving anything, and shrunk. Never used for the saved
 * thumbnail, so no headshot is stored in a design row.
 */
async function workspacePictures(clientId: string): Promise<{ photo?: string; cutout?: string }> {
  const p = await prisma.brandProfile.findUnique({ where: { clientId }, select: { primaryLogoUrl: true, coverPhotoUrl: true, coverPhotoSource: true, visualAssets: true } });
  if (!p) return {};
  const [photo, cutout] = await Promise.all([hostedCoverPhoto(p).catch(() => undefined), coverCutout(p).catch(() => undefined)]);
  return { photo: await shrinkDataUrl(photo, PREVIEW_PICTURE_PX), cutout: cutout && (await shrinkDataUrl(cutout.src, PREVIEW_PICTURE_PX)) };
}

async function limited(key: string, limit: number) {
  const { allowed } = await checkRateLimit(key, limit, 60);
  if (!allowed) throw new HttpError(429, "Too many tries. Wait a minute and try again.");
}

/** The check alone: draws the previews, saves nothing. */
export async function checkCoverTemplate(clientId: string, html: unknown): Promise<CheckOutcome> {
  await limited(`cover-template-check:${clientId}`, CHECKS_PER_MINUTE);
  const result = await checkTemplate(html, await workspaceColours(clientId), () => workspacePictures(clientId));
  return result.ok ? { ok: true, name: result.template.name, previews: result.previews, stand_ins: result.standIns } : result;
}

/**
 * Checks, then saves as a new version (or a new design when templateKey is
 * not given). A failed check throws 422 with the problems and stores nothing.
 */
export async function saveCoverTemplate(clientId: string, userId: string, html: unknown, templateKey?: string): Promise<TemplateSummary> {
  await limited(`cover-template-save:${clientId}`, SAVES_PER_MINUTE);
  const result = await checkTemplate(html, await workspaceColours(clientId));
  if (!result.ok) throw new HttpError(422, "This design does not follow the contract, so it was not saved.", { errors: result.errors });
  const source = html as string;

  let version = 1;
  let key: string;
  if (templateKey) {
    const latest = await prisma.coverTemplate.findFirst({ where: { clientId, templateKey }, orderBy: { version: "desc" }, select: { templateKey: true, version: true, status: true } });
    if (!latest) throw new HttpError(404, "Design not found.");
    if (latest.status === "ARCHIVED") throw new HttpError(409, "This design was removed; save it as a new design.");
    key = latest.templateKey;
    version = latest.version + 1;
  } else {
    const active = await prisma.coverTemplate.findMany({ where: { clientId, status: "ACTIVE" }, distinct: ["templateKey"], select: { templateKey: true } });
    if (active.length >= LIMITS.templatesPerWorkspace) throw new HttpError(409, `You can keep ${LIMITS.templatesPerWorkspace} designs. Remove one to add another.`);
    key = crypto.randomUUID();
  }

  const thumb = result.previews.find((p) => p.name === "long")?.svg;
  const row = await prisma.coverTemplate.create({
    data: {
      clientId,
      templateKey: key,
      version,
      name: result.template.name,
      sourceHtml: source,
      slots: result.template.slots,
      previewSvg: thumb && Buffer.byteLength(thumb) <= MAX_PREVIEW_BYTES ? thumb : null,
      createdBy: userId,
    },
  });
  return summary(row);
}

const summary = (r: { templateKey: string; name: string; version: number; slots: string[]; previewSvg: string | null; createdAt: Date }): TemplateSummary => ({
  id: r.templateKey,
  name: r.name,
  version: r.version,
  slots: r.slots,
  preview_svg: r.previewSvg,
  created_at: r.createdAt.toISOString(),
});

/** The workspace's active designs, newest version of each. */
export async function listCoverTemplates(clientId: string): Promise<TemplateSummary[]> {
  const rows = await prisma.coverTemplate.findMany({ where: { clientId }, orderBy: [{ createdAt: "desc" }], select: { templateKey: true, name: true, version: true, slots: true, previewSvg: true, createdAt: true, status: true } });
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const seen = latest.get(r.templateKey);
    if (!seen || r.version > seen.version) latest.set(r.templateKey, r);
  }
  return [...latest.values()].filter((r) => r.status === "ACTIVE").map(summary);
}

/** Removes a design from the picker. Posts already drawn on it keep working (their version stays). */
export async function archiveCoverTemplate(clientId: string, templateKey: string): Promise<void> {
  const { count } = await prisma.coverTemplate.updateMany({ where: { clientId, templateKey }, data: { status: "ARCHIVED" } });
  if (!count) throw new HttpError(404, "Design not found.");
}

/**
 * A design ready to draw, from this workspace only, at a given version (the
 * newest when none). Stored HTML is parsed again here; null when it is
 * missing, belongs to another workspace, or no longer passes the contract.
 */
export async function loadCoverTemplate(clientId: string, templateKey: string, version?: number, opts: { includeArchived?: boolean } = {}): Promise<{ template: Template; version: number } | null> {
  const row = await prisma.coverTemplate.findFirst({
    where: { clientId, templateKey, ...(version ? { version } : {}), ...(opts.includeArchived ? {} : { status: "ACTIVE" }) },
    orderBy: { version: "desc" },
    select: { sourceHtml: true, version: true },
  });
  if (!row) return null;
  const parsed = parseTemplate(row.sourceHtml);
  return parsed.ok ? { template: parsed.template, version: row.version } : null;
}

/** The workspace's active designs as {id, version} (newest version each), without the heavy columns. */
export async function activeCoverDesigns(clientId: string): Promise<{ id: string; version: number }[]> {
  const rows = await prisma.coverTemplate.findMany({ where: { clientId }, select: { templateKey: true, version: true, status: true } });
  const latest = new Map<string, { version: number; status: string }>();
  for (const r of rows) {
    const seen = latest.get(r.templateKey);
    if (!seen || r.version > seen.version) latest.set(r.templateKey, { version: r.version, status: r.status });
  }
  return [...latest].filter(([, v]) => v.status === "ACTIVE").map(([id, v]) => ({ id, version: v.version }));
}

/** "Use only my designs": built-ins leave the rotation. Kept beside the cut-out in visualAssets; other keys stay. */
export async function setUseOnlyMyDesigns(clientId: string, onlyMine: boolean): Promise<void> {
  const profile = await prisma.brandProfile.findUnique({ where: { clientId }, select: { visualAssets: true } });
  if (!profile) throw new HttpError(404, "The workspace has no brand profile.");
  const current = (profile.visualAssets ?? {}) as Record<string, unknown>;
  await prisma.brandProfile.update({ where: { clientId }, data: { visualAssets: { ...current, cover_custom_only: onlyMine } } });
}

export async function getUseOnlyMyDesigns(clientId: string): Promise<boolean> {
  const profile = await prisma.brandProfile.findUnique({ where: { clientId }, select: { visualAssets: true } });
  return readOnlyMine(profile?.visualAssets);
}
