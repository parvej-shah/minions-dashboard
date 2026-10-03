"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles, X, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export interface RunJob {
  startedAt: number;
  runId: string;
}

export interface RunStage {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  /** An estimate of how long the stage usually takes. It paces the stepper and is never shown as a claim. */
  typicalMs: number;
}

/** Tailwind classes are written out in full so the compiler can see them. */
export interface RunTheme {
  frameDone: string;
  barDone: string;
  barRunning: string;
  badgeDone: string;
  badgeRunning: string;
  chip: string;
  accentText: string;
  progressFill: string;
  stageActiveBorder: string;
  stageIconDone: string;
  stageIconActive: string;
  markDone: string;
  markActive: string;
  doneNote: string;
  doneLink: string;
}

type RunMetadata = Record<string, unknown>;

interface RunRecord {
  status?: string;
  metadata?: RunMetadata;
}

export interface RunHudConfig<J extends RunJob> {
  ariaLabel: string;
  headings: { running: string; done: string; failed: string };
  stages: RunStage[];
  theme: RunTheme;
  runningLine: (job: J, activeStage: RunStage) => string;
  doneLine: (job: J, metadata: RunMetadata) => string;
  done: { note: string; label: string; href: (metadata: RunMetadata) => string };
  idleNotes: [string, string];
}

const POLL_MS = 3500;
const FAILED_FALLBACK = "The run stopped before it finished.";

/** The stage a run is on after `elapsedMs`; past the last stage it returns `stages.length`. */
function stageIndexForElapsed(stages: RunStage[], elapsedMs: number): number {
  let boundary = 0;
  for (let i = 0; i < stages.length; i++) {
    boundary += stages[i].typicalMs;
    if (elapsedMs < boundary) return i;
  }
  return stages.length;
}

const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

type Outcome = { phase: "running" } | { phase: "done"; metadata: RunMetadata } | { phase: "failed"; reason: string };

interface Props<J extends RunJob> {
  job: J | null;
  config: RunHudConfig<J>;
  onDismiss: () => void;
}

export default function RunProgressHUD<J extends RunJob>({ job, config, onDismiss }: Props<J>) {
  const { stages, theme } = config;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>({ phase: "running" });

  useEffect(() => {
    if (!job) {
      const reset = setTimeout(() => {
        setElapsedSeconds(0);
        setOutcome({ phase: "running" });
      }, 0);
      return () => clearTimeout(reset);
    }
    const interval = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - job.startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [job]);

  const settled = outcome.phase !== "running";
  useEffect(() => {
    if (!job || settled) return;
    const poll = async () => {
      try {
        const run = await apiClient.get<RunRecord>(`/api/pipeline/runs/${job.runId}`);
        if (run.status === "COMPLETED") setOutcome({ phase: "done", metadata: run.metadata ?? {} });
        else if (run.status === "FAILED") {
          const reason = run.metadata?.error;
          setOutcome({ phase: "failed", reason: typeof reason === "string" ? reason : FAILED_FALLBACK });
        }
      } catch (err) {
        console.error("Could not read the run status:", err);
      }
    };
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [job, settled]);

  if (!job) return null;

  const isCompleted = outcome.phase === "done";
  const hasFailed = outcome.phase === "failed";
  const elapsedMs = elapsedSeconds * 1000;
  const activeStage = stageIndexForElapsed(stages, elapsedMs);
  const isOverrunning = !settled && activeStage >= stages.length;
  const totalTypicalMs = stages.reduce((sum, stage) => sum + stage.typicalMs, 0);
  // Only a real terminal status may show a finished bar.
  const percent = isCompleted ? 100 : Math.min(95, Math.round((elapsedMs / totalTypicalMs) * 100));

  const subtitle =
    outcome.phase === "done"
      ? config.doneLine(job, outcome.metadata)
      : outcome.phase === "failed"
        ? outcome.reason
        : isOverrunning
          ? "Taking longer than usual, still working"
          : config.runningLine(job, stages[activeStage]);

  return (
    <aside
      role="complementary"
      aria-label={config.ariaLabel}
      className={`fixed bottom-5 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-[#0B0F14]/95 border ${
        isCompleted ? theme.frameDone : hasFailed ? "border-danger/60 shadow-danger/20" : "border-line shadow-black/80"
      } shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col`}
    >
      <div className={`h-1 w-full transition-all duration-500 ${isCompleted ? theme.barDone : hasFailed ? "bg-danger" : theme.barRunning}`} />

      <div className="p-4 flex items-center justify-between gap-3 border-b border-line/60 bg-canvas/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isCompleted ? theme.badgeDone : hasFailed ? "bg-danger/20 text-danger border border-danger/40" : theme.badgeRunning
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : hasFailed ? <X className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                {isCompleted ? config.headings.done : hasFailed ? config.headings.failed : config.headings.running}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  hasFailed ? "text-danger bg-danger/10 border-danger/20" : theme.chip
                }`}
              >
                {formatClock(elapsedSeconds)}
              </span>
            </div>
            <p className="text-[11px] text-muted truncate max-w-[220px]">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-subtle hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded text-subtle hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            title="Dismiss HUD"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted">
                {isCompleted ? "Pipeline completed" : hasFailed ? "Pipeline stopped" : `Step ${Math.min(activeStage + 1, stages.length)} of ${stages.length}`}
              </span>
              <span className={`font-bold ${hasFailed ? "text-danger" : theme.accentText}`}>
                {isCompleted ? "Done" : hasFailed ? "Error" : formatClock(elapsedSeconds)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
              {hasFailed ? (
                <div className="h-full w-full bg-danger rounded-full" />
              ) : (
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${theme.progressFill}`}
                  style={{ width: `${percent}%` }}
                />
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              // A failed run keeps the stages before the one it died on as done; the rest never ran.
              const isStageDone = isCompleted || index < activeStage;
              const isStageActive = !settled && index === activeStage;
              const isStagePending = !settled && index > activeStage;
              const isStageFailed = hasFailed && index === activeStage;

              return (
                <div
                  key={stage.id}
                  aria-current={isStageActive ? "step" : undefined}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isStageActive ? `bg-surface-2 ${theme.stageActiveBorder}` : isStagePending ? "bg-surface/40 border-line/60" : "bg-surface/60 border-line"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isStageFailed ? "bg-danger/10 text-danger" : isStageDone ? theme.stageIconDone : isStageActive ? theme.stageIconActive : "bg-surface-2 text-subtle"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <span className={`block text-xs font-semibold truncate ${isStagePending ? "text-subtle" : "text-white"}`}>{stage.name}</span>
                      <p className="text-[10px] text-muted truncate">
                        {isStagePending ? `Typically ${Math.round(stage.typicalMs / 1000)}s` : stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isStageFailed ? (
                      <X className="w-3.5 h-3.5 text-danger" />
                    ) : isStageDone ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${theme.markDone}`} />
                    ) : isStageActive ? (
                      <Loader2 className={`w-3.5 h-3.5 animate-spin ${theme.markActive}`} />
                    ) : (
                      <span className="block w-1.5 h-1.5 rounded-full bg-line" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {outcome.phase === "done" ? (
            <div className="pt-2 border-t border-line flex items-center justify-between gap-3">
              <span className={`text-[11px] font-medium flex items-center gap-1 ${theme.doneNote}`}>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                {config.done.note}
              </span>
              <Link href={config.done.href(outcome.metadata)} onClick={onDismiss} className={theme.doneLink}>
                <span>{config.done.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-[10px] text-subtle text-center italic pt-1 space-y-0.5">
              <p>{config.idleNotes[0]}</p>
              <p>{config.idleNotes[1]}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
