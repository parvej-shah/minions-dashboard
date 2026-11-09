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
 * stage progress mid-run, so the durations are rough shares of a measured run
 * (about 77s on 2026-11-09). The cover is drawn in code and takes about a second.
 */
const STAGES: RunStage[] = [
  { id: "strategist", name: "Strategist Minion", icon: Brain, typicalMs: 8000, description: "Formulating the thesis angle and defending it" },
  { id: "writer", name: "Writer Minion", icon: PenTool, typicalMs: 45000, description: "Authoring the 800–1,200 word deep dive" },
  { id: "editor", name: "Editor / Critic Minion", icon: ShieldCheck, typicalMs: 15000, description: "Extracting and classifying every factual claim" },
  { id: "variants", name: "Distribution Minion", icon: Share2, typicalMs: 12000, description: "Writing the LinkedIn, Facebook and X variants" },
  { id: "artist", name: "Cover Minion", icon: Palette, typicalMs: 2000, description: "Drawing the cover in your brand's colours and type" },
];

const CONFIG: RunHudConfig<DraftingJob> = {
  ariaLabel: "Multi-agent drafting pipeline status",
  headings: { running: "Drafting Active", done: "Draft Complete", failed: "Draft Failed" },
  stages: STAGES,
  theme: {
    frameDone: "border-brand/60 shadow-brand/20",
    barDone: "bg-brand",
    barRunning: "bg-gradient-to-r from-brand via-brand to-brand animate-pulse",
    badgeDone: "bg-brand/20 text-brand border border-brand/40",
    badgeRunning: "bg-brand/20 text-brand border border-brand/40 animate-pulse",
    chip: "text-brand bg-brand/10 border-brand/20",
    accentText: "text-brand",
    progressFill: "bg-gradient-to-r from-brand to-brand",
    stageActiveBorder: "border-brand/50",
    stageIconDone: "bg-brand/10 text-brand",
    stageIconActive: "bg-brand/10 text-brand",
    markDone: "text-brand",
    markActive: "text-brand",
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
