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
  Radio,
} from "lucide-react";

import { GATE_VERDICT_BADGE, getAudienceBadgeClass, getSourceTag } from "@/constants/ideaBadges";
import { IDEA_STAGE_LABELS, toIdeaStage } from "@/constants/ideaStage";
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

/** Read-only detail drawer for a single harvested idea. */
export default function IdeaDetailModal({
  idea: detailIdea,
  claimingIds,
  onClose,
  onDraft,
  onEdit,
  onSchedule,
  onRequestDelete,
}: IdeaDetailModalProps) {
  return (
    <Modal isOpen onClose={onClose} variant="sheet" maxWidthClass="max-w-2xl" hideCloseButton>
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-canvas/50 px-4 py-4 sm:p-6">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getAudienceBadgeClass(detailIdea.audience || "ICP")}`}>
                {detailIdea.audience || "ICP"}
              </span>
              {detailIdea.source_url ? (
                <a
                  href={detailIdea.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full border hover:opacity-80 transition-opacity ${getSourceTag(detailIdea.source || "MANUAL").className}`}
                  title="Verify original source"
                >
                  <span>{getSourceTag(detailIdea.source || "MANUAL").label}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${getSourceTag(detailIdea.source || "MANUAL").className}`}>
                  {getSourceTag(detailIdea.source || "MANUAL").label}
                </span>
              )}
              <span className="hidden text-xs font-mono text-subtle sm:inline">
                {detailIdea.ideaId || detailIdea.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-subtle sm:text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Harvested {formatDateTime(detailIdea.created_at)}</span>
            </div>
          </div>

          <button
            onClick={() => onClose()}
            className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent text-muted transition-all hover:border-line hover:bg-surface-2 hover:text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 text-ink sm:space-y-6 sm:p-6">
          {/* Full Topic Headline */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand break-words">
              Idea
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-snug text-white break-words">
              {detailIdea.title || detailIdea.raw_idea}
            </h2>
          </div>

          {/* Full Strategic Angle / Rationale */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted break-words">
              Strategic Angle & Real-World Thesis
            </div>
            <div className="p-4 rounded-xl bg-canvas border border-line text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap break-words">
              {detailIdea.excerpt || detailIdea.angle || "No extended strategic thesis recorded."}
            </div>
          </div>

          {/* Source & Signal Verification Section */}
          <div className="space-y-3 p-4 rounded-xl bg-canvas/80 border border-line ring-1 ring-brand/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-brand" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand">
                  Source & Signal Verification
                </span>
              </div>
              {detailIdea.source_url && (
                <a
                  href={detailIdea.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-semibold"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="text-xs text-muted leading-relaxed">
              <span className="font-semibold text-white">Origin Source: </span>
              <span>{detailIdea.source_title || getSourceTag(detailIdea.source || "MANUAL").label}</span>
              {detailIdea.source_url && (
                <span className="ml-1 text-subtle font-mono break-all">({detailIdea.source_url})</span>
              )}
            </div>

            {/* If structured signals array is present */}
            {detailIdea.signals && detailIdea.signals.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-line/60">
                <div className="text-[10px] font-mono text-subtle uppercase">Market Signals Captured ({detailIdea.signals.length})</div>
                <div className="space-y-2">
                  {detailIdea.signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-2/80 border border-line space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-ink leading-snug">
                          {sig.title || "Untitled Signal"}
                        </div>
                        {sig.url && (
                          <a
                            href={sig.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:text-white shrink-0 p-1"
                            title="Open Signal URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {sig.snippet && (
                        <p className="text-[11px] text-muted leading-relaxed line-clamp-3">
                          {sig.snippet}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-subtle">
                        {sig.source && (
                          <span className="px-1.5 py-0.5 rounded bg-surface border border-line text-brand">
                            {sig.source}
                          </span>
                        )}
                        {sig.published_at && (
                          <span>{sig.published_at}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : detailIdea.why ? (
              <div className="text-xs text-muted pt-1 border-t border-line/40">
                <span className="text-subtle font-mono uppercase text-[10px] block mb-0.5">Strategist Signal Rationale</span>
                <p className="italic text-[#CBD5E1]">&quot;{detailIdea.why}&quot;</p>
              </div>
            ) : null}
          </div>

          {/* Authority check (phase 3 gate) */}
          {detailIdea.authority && (
            <div className="p-3.5 rounded-xl bg-surface-2/60 border border-line space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-subtle uppercase">Authority check</div>
                <span
                  className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${GATE_VERDICT_BADGE[detailIdea.authority.verdict].className}`}
                  title={GATE_VERDICT_BADGE[detailIdea.authority.verdict].hint}
                >
                  {GATE_VERDICT_BADGE[detailIdea.authority.verdict].label}
                  {detailIdea.authority.score != null ? ` · ${detailIdea.authority.score}/100` : ""}
                </span>
              </div>
              {detailIdea.authority.icp_problem && (
                <div className="text-xs">
                  <span className="text-subtle">ICP problem: </span>
                  <span className="text-[#CBD5E1]">{detailIdea.authority.icp_problem}</span>
                </div>
              )}
              {detailIdea.authority.author_advantage && (
                <div className="text-xs">
                  <span className="text-subtle">Your advantage: </span>
                  <span className="text-[#CBD5E1]">{detailIdea.authority.author_advantage}</span>
                </div>
              )}
              {detailIdea.authority.trust_basis.length > 0 && (
                <div className="text-[10px] font-mono text-subtle">
                  Rests on: {detailIdea.authority.trust_basis.map((t) => t.toLowerCase().replace(/_/g, " ")).join(", ")}
                </div>
              )}
              {detailIdea.authority.reasons.length > 0 && (
                <ul className="text-xs text-gold list-disc pl-4 space-y-0.5">
                  {detailIdea.authority.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-surface-2/60 border border-line space-y-1">
              <div className="text-[10px] font-mono text-subtle uppercase">Audience Objective</div>
              <div className="text-xs font-semibold text-white">
                {detailIdea.audience === "ICP" 
                  ? "Ideal Customer Profile (Core Target)"
                  : detailIdea.audience === "PEER"
                  ? "Industry Peers & Practitioners"
                  : "Strategic Market / Investors"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2/60 border border-line space-y-1">
              <div className="text-[10px] font-mono text-subtle uppercase">Status</div>
              <div className="text-xs font-semibold text-brand flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <span>{IDEA_STAGE_LABELS[toIdeaStage(detailIdea.status)]}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {detailIdea.tags && detailIdea.tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-subtle uppercase">Signal Keywords</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {detailIdea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted bg-canvas border border-line px-2.5 py-1 rounded-lg font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-canvas/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex sm:items-center sm:justify-between sm:p-6">
          <div className="contents sm:flex sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={() => {
                const ideaToEdit = detailIdea;
                onClose();
                onEdit(ideaToEdit);
              }}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-3 hover:text-white"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const ideaToSchedule = detailIdea;
                onClose();
                onSchedule(ideaToSchedule);
              }}
              className={buttonStyles({ variant: "soft", size: "sm", className: "w-full" })}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const idToDelete = detailIdea.id || detailIdea.ideaId || "";
                const titleToDelete = detailIdea.title || detailIdea.raw_idea || "";
                onClose();
                onRequestDelete({ id: idToDelete, title: titleToDelete });
              }}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-transparent px-3.5 py-2 text-xs font-semibold text-danger transition-colors hover:border-danger/30 hover:bg-danger/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="col-span-2 sm:flex sm:items-center sm:gap-2">
            {detailIdea.status === "PUBLISHED" ? (
              <Link
                href="/published"
                onClick={() => onClose()}
                className={buttonStyles({ size: "sm", className: "w-full" })}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View in Published Stream ↗</span>
              </Link>
            ) : detailIdea.status === "DRAFTED" ? (
              <Link
                href="/editorial"
                onClick={() => onClose()}
                className="inline-flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#3B82F6]/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open in Editorial Studio →</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  const idToDraft = detailIdea.id || detailIdea.ideaId || "";
                  onClose();
                  onDraft(idToDraft);
                }}
                disabled={claimingIds.has(detailIdea.id) || claimingIds.has(detailIdea.ideaId || "")}
                className={buttonStyles({ size: "sm", className: "w-full" })}
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Draft</span>
              </button>
            )}
          </div>
        </div>
    </Modal>
  );
}
