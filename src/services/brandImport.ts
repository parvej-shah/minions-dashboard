import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { chatContent } from "@/lib/ai/qwen";
import { blockingCodeFindings } from "@/lib/ai/memoryCheck";
import { readWebsite, type WebsiteRead } from "@/lib/ai/websiteContext";
import { parseIcpInput, parseMemoryContent } from "@/lib/authorInput";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseBrandProof } from "@/lib/brand-proof";
import { renderAudienceRead, renderExperienceRead, renderProfileRead } from "@/lib/prompts/brandImport";
import {
  bylineFromHeadline,
  checkExperience,
  checkFocus,
  checkIcp,
  checkIdentity,
  checkProofs,
  checkVoice,
  glimpses,
  matchKey,
  parseReply,
  unglue,
  type ImportSource,
} from "@/lib/brandImport/check";
import type { ImportedExperienceKind, ImportedIcp, ImportEvent, ImportMode } from "@/lib/brandImport/types";
import { MAX_MEMORY_ITEMS } from "@/constants/contentLanes";
import { saveIcp } from "@/services/icp";
import { addProofs, seedVoice } from "@/services/voiceProof";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, HttpError } from "@/server/http/errors";

/**
 * Brand import (decision 2026-10-12): reads the author's LinkedIn PDF text and
 * website and streams what it finds, so setup is read rather than typed.
 * Nothing is saved while it runs; applyBrandImport saves what the author kept
 * on the review screen. In refresh mode (the Brand page) only things the
 * workspace does not have yet are offered.
 */

const PROFILE_MIN_CHARS = 80;
const PROFILE_MAX_CHARS = 20_000;
const ABOUT_FOR_AUDIENCE_CHARS = 3000;
const IMPORTS_PER_HOUR = 8;
const MAX_APPLIED_EXPERIENCE = 10;
const PROFILE_LABEL = "LinkedIn profile";
const LABEL = "brand-import";

export interface ImportInput {
  mode: ImportMode;
  profileText: string;
  websiteUrl: string;
}

type Emit = (event: ImportEvent) => void;

function cleanProfileText(value: unknown): string {
  return unglue(asString(value).replace(/\r/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, PROFILE_MAX_CHARS);
}

/** Validates and rate-limits before the stream opens, so a refusal is a normal HTTP error. */
export async function prepareBrandImport(clientId: string, body: JsonObject, mode: ImportMode): Promise<ImportInput> {
  const profileText = cleanProfileText(body.profile_text);
  const websiteUrl = asString(body.website_url).slice(0, 300);
  if (profileText.length < PROFILE_MIN_CHARS && !websiteUrl) {
    throw badRequest("Add your LinkedIn PDF or your website, so there is something to read.");
  }
  const { allowed } = await checkRateLimit(`brand-import:${clientId}`, IMPORTS_PER_HOUR, 3600);
  if (!allowed) throw new HttpError(429, "That's a lot of imports in an hour. Try again a little later.");
  return { mode, profileText: profileText.length >= PROFILE_MIN_CHARS ? profileText : "", websiteUrl };
}

const pageLabel = (url: string) => {
  const parsed = new URL(url);
  return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "")}`;
};

const siteSources = (site: WebsiteRead | null): ImportSource[] =>
  site?.pages.map((page) => ({ label: pageLabel(page.url), text: `${page.title}\n${page.text}` })) ?? [];

async function ask(payload: ReturnType<typeof renderProfileRead>) {
  return parseReply(await chatContent(payload, LABEL));
}

interface Existing {
  memories: Set<string>;
  proofs: Set<string>;
  icp: ImportedIcp | null;
  hasVoice: boolean;
}

async function loadExisting(clientId: string): Promise<Existing> {
  const [memories, proofs, icp, profile] = await Promise.all([
    prisma.professionalMemory.findMany({ where: { clientId }, select: { content: true } }),
    prisma.brandDirective.findMany({ where: { clientId, category: "PROOF" }, select: { instruction: true } }),
    prisma.icpProfile.findUnique({ where: { clientId } }),
    prisma.brandProfile.findUnique({ where: { clientId }, select: { toneQuestionnaire: true } }),
  ]);
  return {
    hasVoice: Boolean(profile?.toneQuestionnaire),
    memories: new Set(memories.map((m) => matchKey(m.content))),
    proofs: new Set(proofs.flatMap((p) => parseBrandProof(p.instruction)?.claim ?? []).map(matchKey)),
    icp: icp
      ? {
          who: icp.who,
          role: icp.role,
          company_type: icp.companyType,
          pains: icp.pains,
          decisions: icp.decisions,
          questions: icp.questions,
          buying_triggers: icp.buyingTriggers,
          vocabulary: icp.vocabulary,
        }
      : null,
  };
}

const LIST_KEYS = ["pains", "decisions", "questions", "buying_triggers", "vocabulary"] as const;
const SCALAR_KEYS = ["who", "role", "company_type"] as const;

/** On a refresh, only what the workspace's audience lacks: empty fields and new list items. */
function newAudience(found: ImportedIcp, current: ImportedIcp | null): ImportedIcp | null {
  if (!current) return found;
  const fresh = { ...found };
  for (const key of SCALAR_KEYS) if (current[key].trim()) fresh[key] = "";
  for (const key of LIST_KEYS) {
    const have = new Set(current[key].map((item) => item.toLowerCase()));
    fresh[key] = found[key].filter((item) => !have.has(item.toLowerCase()));
  }
  const anything = SCALAR_KEYS.some((key) => fresh[key]) || LIST_KEYS.some((key) => fresh[key].length);
  return anything ? fresh : null;
}

/** Runs the three reads in parallel and emits each result as it lands. */
export async function runBrandImport(clientId: string, input: ImportInput, emit: Emit): Promise<void> {
  const existing = input.mode === "refresh" ? await loadExisting(clientId) : null;
  const newId = () => randomUUID().slice(0, 8);
  const profile: ImportSource | null = input.profileText ? { label: PROFILE_LABEL, text: input.profileText } : null;
  let found = 0;

  if (profile) {
    emit({ type: "step", step: "profile", state: "active" });
    for (const line of glimpses(profile.text, 8)) emit({ type: "glimpse", text: line, from: PROFILE_LABEL });
  } else {
    emit({ type: "step", step: "profile", state: "skipped" });
  }

  const site: Promise<WebsiteRead | null> = (async () => {
    if (!input.websiteUrl) {
      emit({ type: "step", step: "website", state: "skipped" });
      return null;
    }
    emit({ type: "step", step: "website", state: "active", detail: input.websiteUrl });
    const read = await readWebsite(input.websiteUrl);
    if (!read) {
      emit({ type: "step", step: "website", state: "skipped", detail: "Couldn't open that site" });
      return null;
    }
    emit({ type: "website", domain: read.domain, pages: read.pages.map((p) => ({ url: p.url, title: p.title })) });
    for (const page of read.pages) {
      const line = glimpses(page.text, 1)[0];
      if (line) emit({ type: "glimpse", text: line, from: pageLabel(page.url) });
    }
    emit({ type: "step", step: "website", state: "done", detail: `${read.pages.length} page${read.pages.length === 1 ? "" : "s"} read` });
    return read;
  })();

  const whoAndVoice = async () => {
    const sources = profile ? [profile] : siteSources(await site);
    if (!sources.length) return;
    emit({ type: "step", step: "voice", state: "active" });
    const reply = await ask(renderProfileRead(sources));
    const all = sources.map((s) => s.text).join("\n");
    const identity = checkIdentity(reply?.identity, all);
    if (identity) emit({ type: "identity", identity });
    const focus = checkFocus(reply?.focus);
    if (focus) emit({ type: "focus", focus });
    // Voice is read only from what the author wrote themselves, never from site marketing copy.
    // A refresh never offers a voice over one the author already set.
    const voice = profile && !existing?.hasVoice ? checkVoice(reply?.voice, profile.text) : null;
    if (voice) emit({ type: "voice", voice });
    found += [identity, focus, voice].filter(Boolean).length;
    emit({ type: "step", step: "voice", state: voice ? "done" : "skipped" });
    if (profile) emit({ type: "step", step: "profile", state: "done", detail: identity?.name });
  };

  const experience = async () => {
    const sources = [...(profile ? [profile] : []), ...siteSources(await site)];
    if (!sources.length) return;
    emit({ type: "step", step: "experience", state: "active" });
    const reply = await ask(renderExperienceRead(sources));
    const items = checkExperience(reply?.items, sources, newId).filter((item) => !existing?.memories.has(matchKey(item.content)));
    if (items.length) emit({ type: "experience", items });
    found += items.length;
    emit({ type: "step", step: "experience", state: "done", detail: `${items.length} found` });
  };

  const audience = async () => {
    const read = await site;
    const about = profile?.text.slice(0, ABOUT_FOR_AUDIENCE_CHARS) ?? "";
    const pages = read?.pages.map((p) => ({ label: pageLabel(p.url), url: p.url, text: p.text })) ?? [];
    if (!about && !pages.length) return;
    emit({ type: "step", step: "audience", state: "active" });
    if (read) emit({ type: "step", step: "proof", state: "active" });
    const reply = await ask(renderAudienceRead({ about, pages }));

    const checked = checkIcp(reply?.icp);
    const icp = checked ? newAudience(checked, existing?.icp ?? null) : null;
    if (icp) emit({ type: "audience", icp });
    emit({ type: "step", step: "audience", state: icp ? "done" : "skipped" });

    const proofs = read ? checkProofs(reply?.proofs, read.pages, newId).filter((p) => !existing?.proofs.has(matchKey(p.claim))) : [];
    if (proofs.length) emit({ type: "proof", items: proofs });
    emit({ type: "step", step: "proof", state: proofs.length ? "done" : "skipped", detail: `${proofs.length} found` });
    found += (icp ? 1 : 0) + proofs.length;
  };

  // One read failing must not stop the others; each logs and the rest carry on.
  const settled = await Promise.allSettled([whoAndVoice(), experience(), audience()]);
  for (const result of settled) if (result.status === "rejected") console.warn(`[${LABEL}] a read failed:`, result.reason);

  if (!found && input.mode === "onboarding") {
    emit({ type: "error", message: "Minions couldn't read enough from that. Try the PDF again, or answer three quick questions instead." });
    return;
  }
  emit({ type: "done" });
}

const IMPORT_KINDS: ImportedExperienceKind[] = ["CURRENT_WORK", "PAST_EXPERIENCE"];

/** Merges the kept audience into the saved one: saved fields win, list items are added. */
async function mergeAudience(clientId: string, raw: unknown): Promise<boolean> {
  const found = parseIcpInput(raw);
  if ("error" in found) return false;
  const current = await prisma.icpProfile.findUnique({ where: { clientId } });
  await saveIcp(clientId, {
    who: current?.who || found.who,
    role: current?.role || found.role,
    company_type: current?.companyType || found.company_type,
    pains: [...(current?.pains ?? []), ...found.pains],
    decisions: [...(current?.decisions ?? []), ...found.decisions],
    questions: [...(current?.questions ?? []), ...found.questions],
    buying_triggers: [...(current?.buyingTriggers ?? []), ...found.buying_triggers],
    vocabulary: [...(current?.vocabulary ?? []), ...found.vocabulary],
  });
  return true;
}

async function addExperience(clientId: string, raw: unknown[]): Promise<number> {
  const rows = await prisma.professionalMemory.findMany({ where: { clientId }, select: { content: true } });
  const have = new Set(rows.map((row) => matchKey(row.content)));
  const room = Math.min(MAX_APPLIED_EXPERIENCE, MAX_MEMORY_ITEMS - rows.length);
  const data: { clientId: string; kind: string; content: string; disclosure: string; source: string }[] = [];
  for (const item of raw) {
    if (data.length >= room) break;
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const kind = IMPORT_KINDS.find((k) => k === r.kind);
    const content = parseMemoryContent(r.content);
    // Confidential material is never stored (decision D4), the same check the Brand page runs.
    if (!kind || typeof content !== "string" || blockingCodeFindings(content).length || have.has(matchKey(content))) continue;
    have.add(matchKey(content));
    data.push({ clientId, kind, content, disclosure: "PUBLIC", source: "IMPORT" });
  }
  if (data.length) await prisma.professionalMemory.createMany({ data });
  return data.length;
}

/** Saves what the author kept on the review screen. Never overwrites something they set themselves. */
export async function applyBrandImport(clientId: string, body: JsonObject) {
  const profile = await prisma.brandProfile.findUnique({ where: { clientId }, select: { id: true, coverByline: true } });
  if (!profile) throw badRequest("Finish setting up your workspace first.");

  // Covers sign off with the author's role; their LinkedIn headline fills it
  // unless they already set one (on the first-post screen or Brand page).
  const byline = profile.coverByline?.trim() ? undefined : bylineFromHeadline(asString(body.headline));
  if (byline) await prisma.brandProfile.update({ where: { clientId }, data: { coverByline: byline } });

  const audience = body.icp ? await mergeAudience(clientId, body.icp) : false;
  const experience = Array.isArray(body.experience) ? await addExperience(clientId, body.experience) : 0;
  const proofs = Array.isArray(body.proofs) ? await addProofs(clientId, body.proofs) : 0;
  const voiceBody = (body.voice && typeof body.voice === "object" ? body.voice : {}) as Record<string, unknown>;
  const voice = body.voice ? await seedVoice(clientId, voiceBody.questionnaire, asString(voiceBody.about)) : { voice: false, sample: false };

  return { success: true, audience, experience_saved: experience, proofs_saved: proofs, voice_set: voice.voice, sample_saved: voice.sample };
}
