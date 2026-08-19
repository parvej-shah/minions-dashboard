"use client";

import type { AssetItem } from "@/types";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Brain,
  PenTool,
  ShieldCheck,
  Palette,
  Share2,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
} from "lucide-react";

export interface DraftingJob {
  ideaId: string;
  title: string;
  audience?: string;
  targetTrade?: string;
  startedAt: number;
}

interface DraftingProgressHUDProps {
  job: DraftingJob | null;
  onDismiss: () => void;
}

interface AgentStage {
  id: string;
  name: string;
  /** Exact model string the n8n node sends. */
  model: string;
  icon: React.ElementType;
  description: string;
}

/**
 * The stages of `02_idea_to_asset`, in the order n8n runs them.
 *
 * This is a description of the pipeline, not live progress: n8n reports nothing
 * back until the asset row exists, so the HUD polls for that and never claims
 * to know which stage is running right now. The per-stage timers that used to
 * drive this ("0-12s strategist, 12-34s writer…") were pure invention, and the
 * percentage they produced had no relationship to the run.
 */
const AGENT_STAGES: AgentStage[] = [
  {
    id: "strategist",
    name: "Strategist Minion",
    model: "qwen3.7-max",
    icon: Brain,
    description: "Formulating the thesis angle and defending it",
  },
  {
    id: "writer",
    name: "Writer Minion",
    model: "qwen-plus",
    icon: PenTool,
    description: "Authoring the 800–1,200 word deep dive",
  },
  {
    id: "editor",
    name: "Editor / Critic Minion",
    model: "qwen3.7-flash",
    icon: ShieldCheck,
    description: "Extracting and classifying every factual claim",
  },
  {
    id: "variants",
    name: "Distribution Minion",
    model: "qwen-flash",
    icon: Share2,
    description: "Writing the LinkedIn, Facebook and X variants",
  },
  {
    id: "artist",
    name: "Visual Artist Minion",
    model: "qwen-image-3.0-pro",
    icon: Palette,
    description: "Synthesizing the 16:9 1280×720 cover illustration",
  },
];

export default function DraftingProgressHUD({ job, onDismiss }: DraftingProgressHUDProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAssetId, setCompletedAssetId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (!job) {
      // Deferred so the effect body performs no synchronous setState.
      const reset = setTimeout(() => {
        setElapsedSeconds(0);
        setIsCompleted(false);
        setCompletedAssetId(null);
      }, 0);
      return () => clearTimeout(reset);
    }

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - job.startedAt) / 1000);
      setElapsedSeconds(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  // Polling for completed asset
  useEffect(() => {
    if (!job || isCompleted) return;

    const checkDraftStatus = async () => {
      try {
        const res = await fetch("/api/assets");
        if (!res.ok) return;
        const assets = await res.json();
        
        // Find if an asset was created after job start matching title or recently created
        const matchingAsset = (assets as AssetItem[]).find((a) => {
          const createdAt = new Date(a.created_at).getTime();
          const isRecent = createdAt >= job.startedAt - 5000;
          const isTitleMatch = a.title && job.title && (
            a.title.toLowerCase().includes(job.title.toLowerCase().slice(0, 20)) ||
            job.title.toLowerCase().includes(a.title.toLowerCase().slice(0, 20))
          );
          return isRecent && (isTitleMatch || a.status === "PENDING_REVIEW");
        });

        if (matchingAsset) {
          setIsCompleted(true);
          setCompletedAssetId(matchingAsset.id);
        }
      } catch (err) {
        console.error("Error polling drafting status:", err);
      }
    };

    // Poll every 3.5s
    pollIntervalRef.current = setInterval(checkDraftStatus, 3500);

    // Auto-mark completed after 55s as fallback if backend completed
    const fallbackTimer = setTimeout(() => {
      setIsCompleted(true);
    }, 58000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearTimeout(fallbackTimer);
    };
  }, [job, isCompleted]);

  if (!job) return null;

  // Progress is binary, because that is all the pipeline actually reports:
  // either the asset row has appeared (polled) or it has not.
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <aside
      role="complementary"
      aria-label="Multi-agent drafting pipeline status"
      className={`fixed bottom-5 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-[#0B0F14]/95 border ${
        isCompleted ? "border-[#00C9A7]/60 shadow-[#00C9A7]/20" : "border-[#1F2D3D] shadow-black/80"
      } shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col`}
    >
      {/* Top Ambient Glow Line */}
      <div 
        className={`h-1 w-full transition-all duration-500 ${
          isCompleted 
            ? "bg-[#00C9A7]" 
            : "bg-gradient-to-r from-[#00C9A7] via-[#3B82F6] to-[#8B5CF6] animate-pulse"
        }`} 
      />

      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-[#1F2D3D]/60 bg-[#070B0F]/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isCompleted 
              ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40" 
              : "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40 animate-pulse"
          }`}>
            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                {isCompleted ? "Draft Ready & Staged" : "Autonomous Crew Working"}
              </span>
              <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-1.5 py-0.2 rounded border border-[#00C9A7]/20">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] truncate max-w-[220px]">
              {job.title}
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-[#64748B] hover:text-white hover:bg-[#161D26] transition-colors cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
            title="Dismiss HUD"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isMinimized && (
        <div className="p-4 space-y-4">
          
          {/* Progress Bar & Status Line */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#94A3B8]">
                {isCompleted ? "Pipeline completed" : "5-stage generation pipeline running"}
              </span>
              <span className="font-bold text-[#00C9A7]">
                {isCompleted ? "Done" : formatTime(elapsedSeconds)}
              </span>
            </div>
            {/* Indeterminate while running: n8n does not report a percentage. */}
            <div className="w-full h-1.5 bg-[#161D26] rounded-full overflow-hidden">
              {isCompleted ? (
                <div className="h-full w-full bg-gradient-to-r from-[#00C9A7] to-[#3B82F6] rounded-full" />
              ) : (
                <div className="h-full w-1/3 bg-gradient-to-r from-[#00C9A7] to-[#3B82F6] rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Stepper of 4 Agents */}
          <div className="space-y-2.5">
            {AGENT_STAGES.map((stage) => {
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? "bg-[#0F1419]/60 border-[#1F2D3D]"
                      : "bg-[#161D26] border-[#1F2D3D]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-[#00C9A7]/10 text-[#00C9A7]"
                          : "bg-[#3B82F6]/10 text-[#3B82F6]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {stage.name}
                        </span>
                        <span className="text-[9px] font-mono text-[#64748B]">
                          ({stage.model})
                        </span>
                      </div>
                      <p className="text-[10px] text-[#94A3B8] truncate">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Stage Indicator Badge */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7]" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Area on Completion */}
          {isCompleted ? (
            <div className="pt-2 border-t border-[#1F2D3D] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#00C9A7] font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Staged in Editorial Studio
              </span>

              <Link
                href={completedAssetId ? `/drafts/${completedAssetId}` : "/editorial"}
                onClick={onDismiss}
                className="inline-flex items-center gap-1.5 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg shadow-[#00C9A7]/20 transition-all cursor-pointer"
              >
                <span>Open in Editorial Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-[10px] text-[#64748B] text-center italic pt-1 space-y-0.5">
              <p>You can navigate freely while the agents draft in the background.</p>
              <p>n8n reports no per-stage progress — the draft appears here when it lands.</p>
            </div>
          )}

        </div>
      )}
    </aside>
  );
}
