"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Brain,
  PenTool,
  ShieldCheck,
  Palette,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ArrowRight
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
  model: string;
  icon: React.ElementType;
  description: string;
  activeDescription: string;
  completedDescription: string;
  estimatedDurationSeconds: number;
}

const AGENT_STAGES: AgentStage[] = [
  {
    id: "strategist",
    name: "Strategist Minion",
    model: "qwen3.7-max",
    icon: Brain,
    description: "Developing contrarian industry angle & strategic thesis",
    activeDescription: "Synthesizing market signals & formulating contrarian angle...",
    completedDescription: "Strategic thesis & tactical angles locked",
    estimatedDurationSeconds: 12,
  },
  {
    id: "writer",
    name: "Writer Minion",
    model: "qwen-plus",
    icon: PenTool,
    description: "Authoring long-form technical article & social variants",
    activeDescription: "Composing 800-word article, LinkedIn & Twitter copy...",
    completedDescription: "Full article draft & omnichannel variants generated",
    estimatedDurationSeconds: 22,
  },
  {
    id: "editor",
    name: "Editor / Critic Minion",
    model: "qwen3.7-flash",
    icon: ShieldCheck,
    description: "Validating claims, voice guidelines & structural flow",
    activeDescription: "Auditing tone, formatting & verifying claims...",
    completedDescription: "Claims verified & tone approved",
    estimatedDurationSeconds: 14,
  },
  {
    id: "artist",
    name: "Visual Artist Minion",
    model: "DashScope / Flux",
    icon: Palette,
    description: "Synthesizing 16:9 2K cover illustration",
    activeDescription: "Rendering 16:9 cinematic cover image...",
    completedDescription: "Cover illustration synthesized & staged",
    estimatedDurationSeconds: 12,
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
      setElapsedSeconds(0);
      setIsCompleted(false);
      setCompletedAssetId(null);
      return;
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
        const matchingAsset = assets.find((a: any) => {
          const createdAt = new Date(a.createdAt || a.created_at).getTime();
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

  // Calculate current stage
  const getStageStatus = (stageIdx: number) => {
    if (isCompleted) return "completed";
    
    // Cumulative thresholds: 0-12s, 12-34s, 34-48s, 48-60s
    let cumulative = 0;
    for (let i = 0; i < stageIdx; i++) {
      cumulative += AGENT_STAGES[i].estimatedDurationSeconds;
    }
    const stageDuration = AGENT_STAGES[stageIdx].estimatedDurationSeconds;

    if (elapsedSeconds < cumulative) return "pending";
    if (elapsedSeconds < cumulative + stageDuration) return "active";
    return "completed";
  };

  const totalEstimatedDuration = AGENT_STAGES.reduce((acc, s) => acc + s.estimatedDurationSeconds, 0);
  const progressPercent = isCompleted 
    ? 100 
    : Math.min(Math.round((elapsedSeconds / totalEstimatedDuration) * 100), 96);

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
                {isCompleted ? "Pipeline Completed" : "4-Agent Generation Pipeline"}
              </span>
              <span className="font-bold text-[#00C9A7]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#161D26] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00C9A7] to-[#3B82F6] transition-all duration-700 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stepper of 4 Agents */}
          <div className="space-y-2.5">
            {AGENT_STAGES.map((stage, idx) => {
              const status = getStageStatus(idx);
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    status === "active"
                      ? "bg-[#161D26] border-[#00C9A7]/40 shadow-sm ring-1 ring-[#00C9A7]/30"
                      : status === "completed"
                      ? "bg-[#0F1419]/60 border-[#1F2D3D]"
                      : "bg-[#070B0F]/40 border-[#1F2D3D]/40 opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        status === "active"
                          ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40"
                          : status === "completed"
                          ? "bg-[#00C9A7]/10 text-[#00C9A7]"
                          : "bg-[#161D26] text-[#64748B]"
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
                        {status === "active"
                          ? stage.activeDescription
                          : status === "completed"
                          ? stage.completedDescription
                          : stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Stage Indicator Badge */}
                  <div className="shrink-0">
                    {status === "active" && (
                      <Loader2 className="w-3.5 h-3.5 text-[#00C9A7] animate-spin" />
                    )}
                    {status === "completed" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7]" />
                    )}
                    {status === "pending" && (
                      <span className="w-2 h-2 rounded-full bg-[#334155] inline-block" />
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
            <div className="text-[10px] text-[#64748B] text-center italic pt-1">
              You can navigate freely while the agents draft in the background.
            </div>
          )}

        </div>
      )}
    </aside>
  );
}
