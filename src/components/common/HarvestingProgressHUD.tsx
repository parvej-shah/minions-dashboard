"use client";

import type { IdeaItem } from "@/types";
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
}

const AGENT_STAGES: AgentStage[] = [
  {
    id: "ingestion",
    name: "Signal Radar",
    icon: Radar,
    description: "Scanning RSS, HVAC forums & brand context",
  },
  {
    id: "filtering",
    name: "Noise Filter",
    icon: Filter,
    description: "Removing duplicates and irrelevant data",
  },
  {
    id: "synthesis",
    name: "Strategic Synthesizer",
    icon: Brain,
    description: "Generating high-intent topical angles",
  },
  {
    id: "sync",
    name: "Database Sync",
    icon: Database,
    description: "Injecting new ideas into stream",
  },
];

export default function HarvestingProgressHUD({ job, onDismiss }: HarvestingProgressHUDProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [harvestedCount, setHarvestedCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (!job) {
      const reset = setTimeout(() => {
        setElapsedSeconds(0);
        setIsCompleted(false);
        setHasFailed(false);
        setHarvestedCount(0);
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
              {isCompleted ? `Found ${harvestedCount} new signals` : hasFailed ? "Pipeline failed to complete" : "Scanning external sources for signals"}
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
                {isCompleted ? "Pipeline completed" : hasFailed ? "Pipeline stopped" : "4-stage harvesting pipeline running"}
              </span>
              <span className={`font-bold ${hasFailed ? "text-[#EF4444]" : "text-[#ff6b4a]"}`}>
                {isCompleted ? "Done" : hasFailed ? "Error" : formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#161D26] rounded-full overflow-hidden">
              {isCompleted ? (
                <div className="h-full w-full bg-gradient-to-r from-[#ff6b4a] to-[#F59E0B] rounded-full" />
              ) : hasFailed ? (
                <div className="h-full w-full bg-[#EF4444] rounded-full" />
              ) : (
                <div className="h-full w-1/3 bg-gradient-to-r from-[#ff6b4a] to-[#F59E0B] rounded-full animate-pulse" />
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
                    isCompleted || hasFailed
                      ? "bg-[#0F1419]/60 border-[#1F2D3D]"
                      : "bg-[#161D26] border-[#1F2D3D]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-[#ff6b4a]/10 text-[#ff6b4a]"
                          : hasFailed
                          ? "bg-[#EF4444]/10 text-[#EF4444]"
                          : "bg-[#F59E0B]/10 text-[#F59E0B]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {stage.name}
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ff6b4a]" />
                    ) : hasFailed ? (
                      <X className="w-3.5 h-3.5 text-[#EF4444]" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />
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
