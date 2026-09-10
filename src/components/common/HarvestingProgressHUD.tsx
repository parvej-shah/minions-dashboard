"use client";


import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Brain,
  Radar,
  Database,
  Filter,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
} from "lucide-react";

export interface HarvestingJob {
  startedAt: number;
  runId: string;
}

interface HarvestingProgressHUDProps {
  job: HarvestingJob | null;
  onDismiss: () => void;
}

interface AgentStage {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  /** Measured from real n8n executions; drives stage advance, never a claim. */
  typicalMs: number;
}

/**
 * Every stage used to render its spinner at once, for the whole run, because
 * nothing tracked which one the workflow was actually on. The progress bar was
 * a literal `w-1/3 animate-pulse`. It looked like telemetry and reported
 * nothing, so a dead run and a working run were indistinguishable.
 *
 * Stages now advance on measured elapsed time against `typicalMs`, taken from
 * real executions (16655: brand context 1.8s, RSS ~4s, Qwen harvest 12.0s,
 * craft 5.2s, DB sync 0.4s). That is still an estimate, so the UI says
 * "typically Ns" rather than claiming to know, and only COMPLETED/FAILED from
 * the run record is ever presented as fact.
 */
const AGENT_STAGES: AgentStage[] = [
  {
    id: "ingestion",
    name: "Signal Radar",
    icon: Radar,
    typicalMs: 6000,
    description: "Reading your sources and brand context",
  },
  {
    id: "filtering",
    name: "Noise Filter",
    icon: Filter,
    typicalMs: 1000,
    description: "Removing duplicates and off-topic signals",
  },
  {
    id: "synthesis",
    name: "Strategic Synthesizer",
    icon: Brain,
    typicalMs: 12000,
    description: "Generating high-intent topical angles",
  },
  {
    id: "craft",
    name: "Craft Study",
    icon: Bot,
    typicalMs: 5200,
    description: "Reading source articles for structure",
  },
  {
    id: "sync",
    name: "Database Sync",
    icon: Database,
    typicalMs: 1000,
    description: "Adding new ideas to your stream",
  },
];

/**
 * Which stage the run is on, given elapsed time.
 *
 * Returns `AGENT_STAGES.length` once past the last boundary, meaning "all
 * stages have had their expected time" -- the run is taking longer than usual
 * and the UI should say so rather than keep animating a fixed spinner.
 */
function stageIndexForElapsed(elapsedMs: number): number {
  let boundary = 0;
  for (let i = 0; i < AGENT_STAGES.length; i++) {
    boundary += AGENT_STAGES[i].typicalMs;
    if (elapsedMs < boundary) return i;
  }
  return AGENT_STAGES.length;
}

const TOTAL_TYPICAL_MS = AGENT_STAGES.reduce((sum, s) => sum + s.typicalMs, 0);

export default function HarvestingProgressHUD({ job, onDismiss }: HarvestingProgressHUDProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [harvestedCount, setHarvestedCount] = useState(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (!job) {
      const reset = setTimeout(() => {
        setElapsedSeconds(0);
        setIsCompleted(false);
        setHasFailed(false);
        setHarvestedCount(0);
        setFailureReason(null);
      }, 0);
      return () => clearTimeout(reset);
    }

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - job.startedAt) / 1000);
      setElapsedSeconds(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  // Polling for completed harvest
  useEffect(() => {
    if (!job || isCompleted || hasFailed) return;

    const checkHarvestStatus = async () => {
      try {
        const res = await fetch(`/api/pipeline/runs/${job.runId}`);
        if (!res.ok) return;
        const run = await res.json();
        
        if (run.status === "COMPLETED") {
          setIsCompleted(true);
          setHarvestedCount(run.metadata?.harvestedCount || 0);
        } else if (run.status === "FAILED") {
          setHasFailed(true);
          setFailureReason(
            typeof run.metadata?.error === "string"
              ? run.metadata.error
              : "The run stopped before it finished."
          );
        }
      } catch (err) {
        console.error("Error polling harvesting status:", err);
      }
    };

    // Poll every 3.5s
    pollIntervalRef.current = setInterval(checkHarvestStatus, 3500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [job, isCompleted, hasFailed]);

  if (!job) return null;

  // Which stage the run is on, and whether it has outrun its expected duration.
  const elapsedMs = elapsedSeconds * 1000;
  const activeStage = stageIndexForElapsed(elapsedMs);
  const isOverrunning = !isCompleted && !hasFailed && activeStage >= AGENT_STAGES.length;
  // Cap at 95% while running: only a real terminal status may show a finished bar.
  const percent = isCompleted
    ? 100
    : Math.min(95, Math.round((elapsedMs / TOTAL_TYPICAL_MS) * 100));

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <aside
      role="complementary"
      aria-label="Multi-agent harvesting pipeline status"
      className={`fixed bottom-5 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-[#0B0F14]/95 border ${
        isCompleted ? "border-[#ff6b4a]/60 shadow-[#ff6b4a]/20" : hasFailed ? "border-[#EF4444]/60 shadow-[#EF4444]/20" : "border-[#1F2D3D] shadow-black/80"
      } shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col`}
    >
      {/* Top Ambient Glow Line */}
      <div 
        className={`h-1 w-full transition-all duration-500 ${
          isCompleted 
            ? "bg-[#ff6b4a]" 
            : hasFailed
            ? "bg-[#EF4444]"
            : "bg-gradient-to-r from-[#ff6b4a] via-[#F59E0B] to-[#ff6b4a] animate-pulse"
        }`} 
      />

      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-[#1F2D3D]/60 bg-[#070B0F]/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isCompleted 
              ? "bg-[#ff6b4a]/20 text-[#ff6b4a] border border-[#ff6b4a]/40" 
              : hasFailed
              ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40"
              : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 animate-pulse"
          }`}>
            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : hasFailed ? <X className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                {isCompleted ? "Harvest Complete" : hasFailed ? "Harvest Failed" : "Harvester Active"}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${hasFailed ? "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20" : "text-[#ff6b4a] bg-[#ff6b4a]/10 border-[#ff6b4a]/20"}`}>
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] truncate max-w-[220px]">
              {isCompleted
                ? `Found ${harvestedCount} new signals`
                : hasFailed
                  ? failureReason ?? "Pipeline failed to complete"
                  : isOverrunning
                    ? "Taking longer than usual, still working"
                    : AGENT_STAGES[activeStage].description}
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
                {isCompleted
                  ? "Pipeline completed"
                  : hasFailed
                    ? "Pipeline stopped"
                    : `Step ${Math.min(activeStage + 1, AGENT_STAGES.length)} of ${AGENT_STAGES.length}`}
              </span>
              <span className={`font-bold ${hasFailed ? "text-[#EF4444]" : "text-[#ff6b4a]"}`}>
                {isCompleted ? "Done" : hasFailed ? "Error" : formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#161D26] rounded-full overflow-hidden">
              {hasFailed ? (
                <div className="h-full w-full bg-[#EF4444] rounded-full" />
              ) : (
                <div
                  className="h-full bg-gradient-to-r from-[#ff6b4a] to-[#F59E0B] rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${percent}%` }}
                />
              )}
            </div>
          </div>

          {/* Stepper -- each stage carries its own state, not one shared spinner */}
          <div className="space-y-2.5">
            {AGENT_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              // Completed run: every stage is done. Failed: stages before the
              // one it died on stay done, the rest never ran.
              const isStageDone = isCompleted || index < activeStage;
              const isStageActive = !isCompleted && !hasFailed && index === activeStage;
              const isStagePending = !isCompleted && !hasFailed && index > activeStage;
              const isStageFailed = hasFailed && index === activeStage;

              return (
                <div
                  key={stage.id}
                  aria-current={isStageActive ? "step" : undefined}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isStageActive
                      ? "bg-[#161D26] border-[#F59E0B]/50"
                      : isStagePending
                        ? "bg-[#0F1419]/40 border-[#1F2D3D]/60"
                        : "bg-[#0F1419]/60 border-[#1F2D3D]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isStageFailed
                          ? "bg-[#EF4444]/10 text-[#EF4444]"
                          : isStageDone
                            ? "bg-[#ff6b4a]/10 text-[#ff6b4a]"
                            : isStageActive
                              ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                              : "bg-[#161D26] text-[#64748B]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isStagePending ? "text-[#64748B]" : "text-white"
                          }`}
                        >
                          {stage.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#94A3B8] truncate">
                        {isStagePending
                          ? `Typically ${Math.round(stage.typicalMs / 1000)}s`
                          : stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Stage Indicator Badge */}
                  <div className="shrink-0">
                    {isStageFailed ? (
                      <X className="w-3.5 h-3.5 text-[#EF4444]" />
                    ) : isStageDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ff6b4a]" />
                    ) : isStageActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />
                    ) : (
                      <span className="block w-1.5 h-1.5 rounded-full bg-[#1F2D3D]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Area on Completion */}
          {isCompleted ? (
            <div className="pt-2 border-t border-[#1F2D3D] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#ff6b4a] font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Signals added to Idea Stream
              </span>

              <Link
                href="/ideas"
                onClick={onDismiss}
                className="inline-flex items-center gap-1.5 bg-[#ff6b4a] hover:bg-[#ff522b] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg shadow-[#ff6b4a]/20 transition-all cursor-pointer"
              >
                <span>View Stream</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-[10px] text-[#64748B] text-center italic pt-1 space-y-0.5">
              <p>You can navigate freely while the harvester scans in the background.</p>
              <p>New topics will appear in your Idea Stream once complete.</p>
            </div>
          )}

        </div>
      )}
    </aside>
  );
}
