"use client";

import { Brain, PenTool, Palette, Share2, ShieldCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import RunProgressHUD, { type RunHudConfig, type RunJob, type RunStage } from "./RunProgressHUD";

export interface DraftingJob extends RunJob {
  ideaId: string;
  title: string;
  audience?: string;
  targetTrade?: string;
}

/**
 * The stages of `02_idea_to_asset`, in the order n8n runs them. Nothing reports
 * stage progress mid-run, so the durations are apportioned from the one measured
 * total (cover generation was ~43s of a ~98s run) and relative LLM-call size.
 */
const STAGES: RunStage[] = [
  { id: "strategist", name: "Strategist Minion", icon: Brain, typicalMs: 8000, description: "Formulating the thesis angle and defending it" },
  { id: "writer", name: "Writer Minion", icon: PenTool, typicalMs: 25000, description: "Authoring the 800–1,200 word deep dive" },
  { id: "editor", name: "Editor / Critic Minion", icon: ShieldCheck, typicalMs: 15000, description: "Extracting and classifying every factual claim" },
  { id: "variants", name: "Distribution Minion", icon: Share2, typicalMs: 12000, description: "Writing the LinkedIn, Facebook and X variants" },
  { id: "artist", name: "Visual Artist Minion", icon: Palette, typicalMs: 40000, description: "Synthesizing the 16:9 1280×720 cover illustration" },
];

const CONFIG: RunHudConfig<DraftingJob> = {
  ariaLabel: "Multi-agent drafting pipeline status",
  headings: { running: "Drafting Active", done: "Draft Complete", failed: "Draft Failed" },
  stages: STAGES,
  theme: {
    frameDone: "border-indigo-500/60 shadow-indigo-500/20",
    barDone: "bg-indigo-500",
    barRunning: "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse",
    badgeDone: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40",
    badgeRunning: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 animate-pulse",
    chip: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    accentText: "text-indigo-400",
    progressFill: "bg-gradient-to-r from-indigo-500 to-purple-500",
    stageActiveBorder: "border-indigo-500/50",
    stageIconDone: "bg-indigo-500/10 text-indigo-400",
    stageIconActive: "bg-indigo-500/10 text-indigo-400",
    markDone: "text-indigo-400",
    markActive: "text-indigo-400",
    doneNote: "text-brand",
    doneLink: buttonStyles({ size: "sm" }),
  },
  runningLine: (job) => job.title || "Synthesizing content...",
  doneLine: (job) => job.title || "Draft staged in Editorial Studio",
  done: {
    note: "Staged in Editorial Studio",
    label: "Open in Editorial Studio",
    href: (metadata) => (typeof metadata.assetId === "string" ? `/drafts/${metadata.assetId}` : "/editorial"),
  },
  idleNotes: ["You can navigate freely while the agents draft in the background.", "System reports no per-stage progress — the draft appears here when it lands."],
};

export default function DraftingProgressHUD(props: { job: DraftingJob | null; onDismiss: () => void }) {
  return <RunProgressHUD {...props} config={CONFIG} />;
}
