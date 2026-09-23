"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Unlock,
  CalendarDays,
  ExternalLink,
  Radio,
} from "lucide-react";
import { formatRelativeTime } from "@/utils/date";
import { GATE_VERDICT_BADGE, getAudienceBadgeClass, getSourceTag } from "@/constants/ideaBadges";
import type { AudienceLane, IdeaItem } from "@/types";

export interface IdeaCardProps {
  idea: IdeaItem;
  claimingIds: Set<string>;
  justClaimedIds: Set<string>;
  onOpenDetail: (idea: IdeaItem) => void;
  onDraft: (ideaId: string) => void;
  onResetClaim: (ideaId: string) => void;
  onQueue: (idea: IdeaItem) => void;
  onUnqueue: (idea: IdeaItem) => void;
  onEdit: (idea: IdeaItem) => void;
  onRequestDelete: (target: { id: string; title: string }) => void;
}

/** One harvested idea in the stream grid. */
export default function IdeaCard({
  idea,
  claimingIds,
  justClaimedIds,
  onOpenDetail,
  onDraft,
  onResetClaim,
  onQueue,
  onUnqueue,
  onEdit,
  onRequestDelete,
}: IdeaCardProps) {
  const rawId = idea.ideaId || idea.id || "IDEA-0000";
  const ideaTitle = idea.title || idea.raw_idea || "Untitled Signal";
  const ideaExcerpt = idea.excerpt || idea.angle || "No excerpt or angle notes available.";
  const ideaAudience = (idea.audience || "ICP") as AudienceLane;
  const ideaTrade = idea.target_trade || "UNSPECIFIED";
  const ideaSource = idea.source || "MANUAL";
  const ideaStatus = (idea.status || "HARVESTED").toUpperCase();
  const sourceInfo = getSourceTag(ideaSource);
  const isClaiming = claimingIds.has(idea.id) || claimingIds.has(rawId);
  const isClaimed =
    ideaStatus === "CLAIMED" ||
    ideaStatus === "PICKED" ||
    justClaimedIds.has(idea.id) ||
    justClaimedIds.has(rawId);
  // REVIEW is the real terminal status the pipeline writes once a draft exists;
  // draftAssetId is the authoritative signal either way (status can be forced
  // back to QUEUED/HARVESTED by mistake, draftAssetId can't).
  const isDrafted =
    ideaStatus === "DRAFTED" || ideaStatus === "REVIEW" || Boolean(idea.draftAssetId);
  const isPublished = ideaStatus === "PUBLISHED";
  const isRejected = ideaStatus === "REJECTED";
  const verdict = idea.authority ? GATE_VERDICT_BADGE[idea.authority.verdict] : null;
  const verdictTitle = idea.authority
    ? [verdict?.hint, ...idea.authority.reasons].filter(Boolean).join("\n")
    : undefined;

  return (
            <div
              key={idea.id || rawId}
              onClick={() => onOpenDetail(idea)}
              className="bg-[#0F1419] hover:bg-[#161D26] border border-[#1F2D3D] hover:border-[#00C9A7]/50 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4 group shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99]"
            >
              {/* Hover Glow Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C9A7]/5 blur-2xl pointer-events-none group-hover:bg-[#00C9A7]/10 transition-colors" />

              {/* Top Badge Row */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Audience Badge + Trade Tag + Source Tag */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Audience Badge (Always top-left) */}
                    <span
                      className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${getAudienceBadgeClass(
                        ideaAudience
                      )}`}
                    >
                      {ideaAudience}
                    </span>

                    {/* Authority gate verdict (phase 3) */}
                    {verdict && (
                      <span
                        className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${verdict.className}`}
                        title={verdictTitle}
                      >
                        {verdict.label}
                        {idea.authority?.score != null && idea.authority.verdict !== "REJECT" ? ` · ${idea.authority.score}` : ""}
                      </span>
                    )}

                    {/* Trade Tag (Gray Pill) */}
                    <span className="text-[10px] font-medium bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D] px-2 py-0.5 rounded-full">
                      {ideaTrade}
                    </span>

                    {/* Source Tag (Color Coded with Link if available) */}
                    {idea.source_url ? (
                      <a
                        href={idea.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border hover:opacity-80 transition-opacity ${sourceInfo.className}`}
                        title={`Verify original source: ${idea.source_url}`}
                      >
                        <span>{sourceInfo.label}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                      </a>
                    ) : (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sourceInfo.className}`}
                      >
                        {sourceInfo.label}
                      </span>
                    )}

                    {/* Signal Indicator if signals exist */}
                    {idea.signals && idea.signals.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-[#94A3B8] bg-[#161D26] border border-[#1F2D3D] px-2 py-0.5 rounded-full"
                        title={`${idea.signals.length} market signal(s) linked`}
                      >
                        <Radio className="w-2.5 h-2.5 text-[#00C9A7]" />
                        <span>{idea.signals.length} {idea.signals.length === 1 ? 'signal' : 'signals'}</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Idea ID & Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono text-[#64748B] font-medium mr-1">
                      {rawId}
                    </span>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(idea);
                      }}
                      className="p-1 rounded-md text-[#64748B] hover:text-[#00C9A7] hover:bg-[#161D26] border border-transparent hover:border-[#1F2D3D] transition-all cursor-pointer"
                      title="Edit Idea details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Unlock Button (if claimed) */}
                    {isClaimed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetClaim(idea.id || rawId);
                        }}
                        className="p-1 rounded-md text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 transition-all cursor-pointer"
                        title="Release Lock & Unclaim Idea"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete({ id: idea.id || rawId, title: ideaTitle });
                      }}
                      className="p-1 rounded-md text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/30 transition-all cursor-pointer"
                      title="Delete Idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title (Bold 16px, 2-line clamp) */}
                <h3 className="text-[16px] font-bold leading-snug text-[#F1F5F9] line-clamp-2 break-words group-hover:text-white transition-colors">
                  {ideaTitle}
                </h3>

                {/* Excerpt (Muted 13px, 3-line clamp) */}
                <p className="text-[13px] text-[#94A3B8] leading-relaxed line-clamp-3 break-words">
                  {ideaExcerpt}
                </p>

                {/* Why it was dropped, or why it is below the bar */}
                {idea.authority && idea.authority.verdict !== "PASS" && idea.authority.reasons.length > 0 && (
                  <p className={`text-[12px] leading-relaxed break-words ${idea.authority.verdict === "REJECT" ? "text-[#94A3B8]" : "text-[#F59E0B]"}`}>
                    {idea.authority.verdict === "REJECT" ? "Dropped: " : ""}
                    {idea.authority.reasons.join(" ")}
                  </p>
                )}

                {/* Optional Tags */}
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-[#64748B] bg-[#070B0F] border border-[#1F2D3D] px-2 py-0.2 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Scheduled For Banner / Badge (if scheduled) */}
                {idea.scheduled_for && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-xs font-mono text-[#00C9A7]">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Auto-Draft: {new Date(idea.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Ingested Date & CTA Button */}
              <div className="flex items-center justify-between pt-3.5 border-t border-[#1F2D3D] gap-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
                  <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Ingested {formatRelativeTime(idea.created_at)}</span>
                </div>

                {/* Bottom Right: Action CTA / Status Badge */}
                <div onClick={(e) => e.stopPropagation()}>
                  {isPublished ? (
                    <Link
                      href="/published"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/30 px-3 py-1.5 rounded-lg hover:bg-[#00C9A7]/20 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Published ↗
                    </Link>
                  ) : isDrafted ? (
                    <Link
                      href="/editorial"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-3 py-1.5 rounded-lg hover:bg-[#3B82F6]/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Draft Ready →
                    </Link>
                  ) : isClaimed ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1.5 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                      CLAIMED (Drafting...)
                    </div>
                  ) : isRejected ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] bg-[#161D26] border border-[#1F2D3D] px-2.5 py-1.5 rounded-lg">
                      Rejected
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {ideaStatus === "QUEUED" ? (
                        <button
                          onClick={() => onUnqueue(idea)}
                          className="inline-flex items-center gap-1 bg-[#00C9A7]/10 hover:bg-[#EF4444]/10 text-[#00C9A7] hover:text-[#EF4444] border border-[#00C9A7]/30 hover:border-[#EF4444]/30 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer group"
                          title="Click to remove from queue"
                        >
                          <span className="group-hover:hidden">Queued {idea.queue_order ? `#${idea.queue_order}` : ""}</span>
                          <span className="hidden group-hover:inline">Remove</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onQueue(idea)}
                          className="inline-flex items-center gap-1 bg-[#161D26] hover:bg-[#1F2D3D] text-[#94A3B8] hover:text-white border border-[#1F2D3D] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          title="Add to production queue"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#00C9A7]" />
                          <span>Queue</span>
                        </button>
                      )}

                      <button
                        onClick={() => onDraft(idea.id || rawId)}
                        disabled={isClaiming}
                        className="inline-flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7] text-[#00C9A7] hover:text-[#070B0F] border border-[#00C9A7]/30 hover:border-[#00C9A7] text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <span>Draft Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
  );
}
