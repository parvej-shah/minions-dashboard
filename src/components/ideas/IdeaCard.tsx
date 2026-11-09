"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Loader2,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react";
import { GATE_VERDICT_BADGE, getSourceTag } from "@/constants/ideaBadges";
import type { IdeaItem } from "@/types";
import { Button, buttonStyles } from "@/components/ui/Button";

export interface IdeaCardProps {
  idea: IdeaItem;
  claimingIds: Set<string>;
  justClaimedIds: Set<string>;
  onOpenDetail: (idea: IdeaItem) => void;
  onResetClaim: (ideaId: string) => void;
  onDraft: (ideaId: string) => void;
  onEdit: (idea: IdeaItem) => void;
  onRequestDelete: (target: { id: string; title: string }) => void;
}

export default function IdeaCard({
  idea,
  claimingIds,
  justClaimedIds,
  onOpenDetail,
  onResetClaim,
  onDraft,
  onEdit,
  onRequestDelete,
}: IdeaCardProps) {
  const id = idea.ideaId || idea.id || "IDEA-0000";
  const title = idea.title || idea.raw_idea || "Untitled idea";
  const excerpt = idea.excerpt || idea.angle;
  const status = (idea.status || "HARVESTED").toUpperCase();
  const sourceInfo = getSourceTag(idea.source || "MANUAL");
  const verdict = idea.authority ? GATE_VERDICT_BADGE[idea.authority.verdict] : null;
  const isClaiming = claimingIds.has(idea.id) || claimingIds.has(id);
  const isClaimed = ["CLAIMED", "PICKED", "DRAFTING"].includes(status) || justClaimedIds.has(idea.id) || justClaimedIds.has(id);
  const isPublished = status === "PUBLISHED";
  const isDrafted = !isPublished && (["DRAFTED", "REVIEW"].includes(status) || Boolean(idea.draftAssetId));
  const isRejected = ["REJECTED", "DISCARDED", "FAILED"].includes(status);
  const stageLabel = isPublished ? "Published" : isDrafted ? "Draft ready" : isClaimed || isClaiming || status === "DRAFTING" ? "Drafting" : isRejected ? "Set aside" : "Ready to draft";
  const cardTone = isDrafted
    ? "border-brand/35 bg-brand/5/20 hover:border-brand/60"
    : isPublished
      ? "border-brand/35 bg-brand/[0.04] hover:border-brand/55"
      : isClaimed || isClaiming || status === "DRAFTING"
        ? "border-gold/35 bg-gold/[0.035] hover:border-gold/55"
        : "border-line bg-surface hover:border-brand/40";
  const stageTone = isDrafted
    ? "border-brand/30 bg-brand/10 text-brand"
    : isPublished
      ? "border-brand/30 bg-brand/10 text-brand"
      : isClaimed || isClaiming || status === "DRAFTING"
        ? "border-gold/30 bg-gold/10 text-gold"
        : isRejected
          ? "border-line bg-surface-2 text-subtle"
          : "border-brand/25 bg-brand/[0.07] text-brand";

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 border-b-4 p-5 transition-all hover:-translate-y-0.5 ${cardTone}`}>
      <span className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl transition-colors ${isDrafted ? "bg-brand/5 group-hover:bg-brand/10" : "bg-brand/5 group-hover:bg-brand/10"}`} aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {verdict && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${verdict.className}`}>
              {verdict.label}
            </span>
          )}
          {idea.source_url ? (
            <a href={idea.source_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sourceInfo.className}`} aria-label={`Open source for ${title}`}>
              {sourceInfo.label}<ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
            </a>
          ) : (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${sourceInfo.className}`}>{sourceInfo.label}</span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stageTone}`}>{stageLabel}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isClaimed && (
            <button type="button" onClick={() => onResetClaim(idea.id || id)} aria-label={`Stop drafting ${title}`} className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-gold transition-colors hover:bg-gold/10">
              <Unlock className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => onEdit(idea)} aria-label={`Edit ${title}`} className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-brand">
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onRequestDelete({ id: idea.id || id, title })} aria-label={`Delete ${title}`} className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-subtle transition-colors hover:bg-danger/10 hover:text-danger">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex-1">
        <h3 className="line-clamp-3 text-lg font-extrabold leading-snug text-ink" title={title}>{title}</h3>
        {excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{excerpt}</p>}

        {idea.authority && idea.authority.verdict !== "PASS" && idea.authority.reasons.length > 0 && (
          <p className={`mt-3 text-xs leading-relaxed ${idea.authority.verdict === "REJECT" ? "text-muted" : "text-gold"}`}>
            {idea.authority.verdict === "REJECT" ? "Why it was set aside: " : "Worth checking: "}
            {idea.authority.reasons.join(" ")}
          </p>
        )}

        {idea.scheduled_for && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand/25 bg-brand/10 p-2.5 text-xs font-semibold text-brand">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            Draft scheduled for {new Date(idea.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </div>
        )}
      </div>

      <div className="relative mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => onOpenDetail(idea)} className="min-h-10 cursor-pointer rounded-xl px-3 text-xs font-bold text-muted transition-colors hover:bg-surface-2 hover:text-ink">
          View details
        </button>

        {isPublished ? (
          <Link href="/posts?show=posted" className={buttonStyles({ variant: "soft", size: "sm" })}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Published
          </Link>
        ) : isDrafted ? (
          <Link href="/editorial" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Open draft
          </Link>
        ) : isClaimed || isClaiming ? (
          <span role="status" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 text-xs font-bold text-gold">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating draft
          </span>
        ) : isRejected ? (
          <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-surface-2 px-3 text-xs font-bold text-subtle">Set aside</span>
        ) : (
          <Button variant="primary" size="sm" loading={isClaiming} onClick={() => onDraft(idea.id || id)}>
            Draft now
          </Button>
        )}
      </div>
    </article>
  );
}
