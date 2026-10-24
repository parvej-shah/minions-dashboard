"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Sparkles,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";

import { GATE_VERDICT_BADGE, MANUAL_SOURCE_LABEL, getSourceTag } from "@/constants/ideaBadges";
import { toIdeaStage } from "@/constants/ideaStage";
import type {
  IdeaItem,
} from "@/types";

import { buttonStyles } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/utils/date";
export interface IdeaDetailModalProps {
  idea: IdeaItem;
  claimingIds: Set<string>;
  onClose: () => void;
  onDraft: (ideaId: string) => void;
  onEdit: (idea: IdeaItem) => void;
  onSchedule: (idea: IdeaItem) => void;
  onRequestDelete: (target: { id: string; title: string }) => void;
}

const AUDIENCE_TEXT: Record<string, string> = {
  ICP: "Your customers",
  PEER: "People in your field",
  BRIDGE: "Investors and partners",
};

const sectionLabel = "text-[11px] font-bold uppercase tracking-wider text-muted";

/** Read-only detail drawer for a single idea, in the words a poster uses. */
export default function IdeaDetailModal({
  idea: detailIdea,
  claimingIds,
  onClose,
  onDraft,
  onEdit,
  onSchedule,
  onRequestDelete,
}: IdeaDetailModalProps) {
  const stage = toIdeaStage(detailIdea.status);
  const isDrafted = stage === "DRAFTED" || (Boolean(detailIdea.draftAssetId) && stage !== "PUBLISHED");
  const source = getSourceTag(detailIdea.source || "MANUAL");
  const isManual = source.label === MANUAL_SOURCE_LABEL;
  const authority = detailIdea.authority;
  const verdict = authority ? GATE_VERDICT_BADGE[authority.verdict] : null;
  const point = detailIdea.excerpt || detailIdea.angle;
  const signals = detailIdea.signals ?? [];
  const ideaId = detailIdea.id || detailIdea.ideaId || "";
  const title = detailIdea.title || detailIdea.raw_idea || "";
  const iconButton =
    "flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-2 text-muted transition-colors";

  return (
    <Modal isOpen onClose={onClose} variant="sheet" maxWidthClass="max-w-2xl" hideCloseButton>
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-canvas/50 px-4 py-4 sm:p-6">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {verdict && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${verdict.className}`}
                  title={authority?.score != null ? `${verdict.hint} Score ${authority.score}/100.` : verdict.hint}
                >
                  {verdict.label}
                </span>
              )}
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${source.className}`}>{source.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-subtle sm:text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isManual ? "Added" : "Found"} {formatDateTime(detailIdea.created_at)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onClose()}
            className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent text-muted transition-all hover:border-line hover:bg-surface-2 hover:text-white"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 text-ink sm:p-6">
          <h2 className="text-xl sm:text-2xl font-extrabold leading-snug text-white break-words">{title}</h2>

          {point && (
            <section className="space-y-2">
              <h3 className={sectionLabel}>The point</h3>
              <p className="text-sm leading-relaxed text-[#E2E8F0] whitespace-pre-wrap break-words">{point}</p>
            </section>
          )}

          {(authority?.icp_problem || detailIdea.audience) && (
            <section className="space-y-2">
              <h3 className={sectionLabel}>Who it&apos;s for</h3>
              <p className="text-sm leading-relaxed text-[#E2E8F0]">
                <span className="font-semibold text-white">{AUDIENCE_TEXT[detailIdea.audience || "ICP"] ?? AUDIENCE_TEXT.ICP}</span>
                {authority?.icp_problem ? <>, deciding {lowerFirst(authority.icp_problem)}</> : null}
              </p>
            </section>
          )}

          {authority?.author_advantage && (
            <section className="space-y-2">
              <h3 className={sectionLabel}>Your angle</h3>
              <p className="text-sm leading-relaxed text-[#E2E8F0]">{authority.author_advantage}</p>
              {authority.trust_basis.length > 0 && (
                <p className="text-xs text-subtle">
                  Based on your {authority.trust_basis.map((t) => t.toLowerCase().replace(/_/g, " ")).join(" and ")}.
                </p>
              )}
            </section>
          )}

          {authority && authority.verdict !== "PASS" && authority.reasons.length > 0 && (
            <section className="space-y-2">
              <h3 className={sectionLabel}>{authority.verdict === "REJECT" ? "Why it was set aside" : "Worth checking"}</h3>
              <ul className="list-disc space-y-0.5 pl-4 text-sm text-gold">
                {authority.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {(detailIdea.why || signals.length > 0 || detailIdea.source_url) && (
            <section className="space-y-2">
              <h3 className={sectionLabel}>Why it&apos;s worth posting</h3>
              {detailIdea.why && <p className="text-sm leading-relaxed text-[#CBD5E1]">{detailIdea.why}</p>}
              {signals.length > 0 && (
                <ul className="space-y-2">
                  {signals.map((sig, idx) => (
                    <li key={idx} className="space-y-1 rounded-lg border border-line bg-surface-2/80 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug text-ink">{sig.title || "Untitled source"}</p>
                        {sig.url && (
                          <a href={sig.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 text-brand hover:text-white" aria-label="Open this source">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {sig.snippet && <p className="line-clamp-3 text-[11px] leading-relaxed text-muted">{sig.snippet}</p>}
                      {(sig.source || sig.published_at) && (
                        <p className="text-[10px] text-subtle">{[sig.source, sig.published_at].filter(Boolean).join(" · ")}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {detailIdea.source_url && (
                <a href={detailIdea.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  <span>Open {detailIdea.source_title || "the source"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </section>
          )}

          {detailIdea.tags && detailIdea.tags.length > 0 && (
            <section className="space-y-2">
              <h3 className={sectionLabel}>Keywords</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {detailIdea.tags.map((tag) => (
                  <span key={tag} className="rounded-lg border border-line bg-canvas px-2.5 py-1 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="flex shrink-0 items-center gap-2 border-t border-line bg-canvas/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(detailIdea);
            }}
            className={`${iconButton} hover:bg-surface-3 hover:text-white`}
            title="Edit idea"
            aria-label="Edit idea"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestDelete({ id: ideaId, title });
            }}
            className={`${iconButton} hover:border-danger/30 hover:bg-danger/10 hover:text-danger`}
            title="Delete idea"
            aria-label="Delete idea"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {stage === "PUBLISHED" ? (
              <Link href="/published" onClick={() => onClose()} className={buttonStyles({ size: "sm" })}>
                <CheckCircle2 className="w-4 h-4" />
                <span>See it in Published</span>
              </Link>
            ) : isDrafted ? (
              <Link href="/editorial" onClick={() => onClose()} className={buttonStyles({ size: "sm" })}>
                <Sparkles className="w-4 h-4" />
                <span>Open draft</span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSchedule(detailIdea);
                  }}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDraft(ideaId);
                  }}
                  disabled={claimingIds.has(detailIdea.id) || claimingIds.has(detailIdea.ideaId || "")}
                  className={buttonStyles({ size: "sm" })}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Draft now</span>
                </button>
              </>
            )}
          </div>
        </div>
    </Modal>
  );
}

/** "Whether to hire…" reads as "…, deciding whether to hire…". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
