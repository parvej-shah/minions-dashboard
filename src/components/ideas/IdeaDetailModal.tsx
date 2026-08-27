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
  Globe,
  FileText,
} from "lucide-react";

import { getAudienceBadgeClass, getSourceTag } from "@/constants/ideaBadges";
import type {
  IdeaItem,
} from "@/types";

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F1419] border border-[#1F2D3D] ring-1 ring-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#1F2D3D] flex items-start justify-between gap-4 bg-[#070B0F]/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getAudienceBadgeClass(detailIdea.audience || "ICP")}`}>
                {detailIdea.audience || "ICP"}
              </span>
              <span className="text-[10px] font-medium bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D] px-2.5 py-0.5 rounded-full">
                {detailIdea.target_trade || "HVAC"}
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
              <span className="text-xs font-mono text-[#64748B]">
                {detailIdea.ideaId || detailIdea.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Harvested {new Date(detailIdea.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          <button
            onClick={() => onClose()}
            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#161D26] border border-transparent hover:border-[#1F2D3D] transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#F1F5F9]">
          {/* Full Topic Headline */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00C9A7] break-words">
              Topic & Working Headline
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-snug text-white break-words">
              {detailIdea.title || detailIdea.raw_idea}
            </h2>
          </div>

          {/* Full Strategic Angle / Rationale */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] break-words">
              Strategic Angle & Real-World Thesis
            </div>
            <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap break-words">
              {detailIdea.excerpt || detailIdea.angle || "No extended strategic thesis recorded."}
            </div>
          </div>

          {/* Source & Signal Verification Section */}
          <div className="space-y-3 p-4 rounded-xl bg-[#070B0F]/80 border border-[#1F2D3D] ring-1 ring-[#00C9A7]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00C9A7]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00C9A7]">
                  Source & Signal Verification
                </span>
              </div>
              {detailIdea.source_url && (
                <a
                  href={detailIdea.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#00C9A7] hover:underline font-semibold"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="text-xs text-[#94A3B8] leading-relaxed">
              <span className="font-semibold text-white">Origin Source: </span>
              <span>{detailIdea.source_title || getSourceTag(detailIdea.source || "MANUAL").label}</span>
              {detailIdea.source_url && (
                <span className="ml-1 text-[#64748B] font-mono break-all">({detailIdea.source_url})</span>
              )}
            </div>

            {/* If structured signals array is present */}
            {detailIdea.signals && detailIdea.signals.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-[#1F2D3D]/60">
                <div className="text-[10px] font-mono text-[#64748B] uppercase">Market Signals Captured ({detailIdea.signals.length})</div>
                <div className="space-y-2">
                  {detailIdea.signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#161D26]/80 border border-[#1F2D3D] space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-[#F1F5F9] leading-snug">
                          {sig.title || "Untitled Signal"}
                        </div>
                        {sig.url && (
                          <a
                            href={sig.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00C9A7] hover:text-white shrink-0 p-1"
                            title="Open Signal URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {sig.snippet && (
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-3">
                          {sig.snippet}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#64748B]">
                        {sig.source && (
                          <span className="px-1.5 py-0.5 rounded bg-[#0F1419] border border-[#1F2D3D] text-[#00C9A7]">
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
              <div className="text-xs text-[#94A3B8] pt-1 border-t border-[#1F2D3D]/40">
                <span className="text-[#64748B] font-mono uppercase text-[10px] block mb-0.5">Strategist Signal Rationale</span>
                <p className="italic text-[#CBD5E1]">&quot;{detailIdea.why}&quot;</p>
              </div>
            ) : null}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#161D26]/60 border border-[#1F2D3D] space-y-1">
              <div className="text-[10px] font-mono text-[#64748B] uppercase">Audience Objective</div>
              <div className="text-xs font-semibold text-white">
                {detailIdea.audience === "ICP" 
                  ? "Ideal Customer Profile (Core Target)"
                  : detailIdea.audience === "PEER"
                  ? "Industry Peers & Practitioners"
                  : "Strategic Market / Investors"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161D26]/60 border border-[#1F2D3D] space-y-1">
              <div className="text-[10px] font-mono text-[#64748B] uppercase">Pipeline Status</div>
              <div className="text-xs font-semibold text-[#00C9A7] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
                <span>{detailIdea.status || "HARVESTED"}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {detailIdea.tags && detailIdea.tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-[#64748B] uppercase">Signal Keywords</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {detailIdea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-[#94A3B8] bg-[#070B0F] border border-[#1F2D3D] px-2.5 py-1 rounded-lg font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-4 sm:p-6 border-t border-[#1F2D3D] bg-[#070B0F]/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const ideaToEdit = detailIdea;
                onClose();
                onEdit(ideaToEdit);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="px-3.5 py-2 text-xs font-semibold text-[#00C9A7] hover:text-[#070B0F] bg-[#00C9A7]/10 hover:bg-[#00C9A7] border border-[#00C9A7]/30 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="px-3.5 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/30 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {detailIdea.status === "PUBLISHED" ? (
              <Link
                href="/published"
                onClick={() => onClose()}
                className="inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all"
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
                className="inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Refine & Launch Draft Pipeline (Workflow 02)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
