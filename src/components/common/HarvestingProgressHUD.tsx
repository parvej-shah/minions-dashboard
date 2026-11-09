"use client";

import { Bot, Brain, Database, Filter, Radar } from "lucide-react";
import RunProgressHUD, { type RunHudConfig, type RunJob, type RunStage } from "./RunProgressHUD";

export type HarvestingJob = RunJob;

/** Durations come from real n8n executions (brand context 1.8s, RSS ~4s, Qwen harvest 12.0s, craft 5.2s, DB sync 0.4s). */
const STAGES: RunStage[] = [
  { id: "ingestion", name: "Signal Radar", icon: Radar, typicalMs: 6000, description: "Reading your sources and brand context" },
  { id: "filtering", name: "Noise Filter", icon: Filter, typicalMs: 1000, description: "Removing duplicates and off-topic signals" },
  { id: "synthesis", name: "Strategic Synthesizer", icon: Brain, typicalMs: 12000, description: "Generating high-intent topical angles" },
  { id: "craft", name: "Craft Study", icon: Bot, typicalMs: 5200, description: "Reading source articles for structure" },
  { id: "sync", name: "Database Sync", icon: Database, typicalMs: 1000, description: "Adding new ideas to your stream" },
];

const CONFIG: RunHudConfig<HarvestingJob> = {
  ariaLabel: "Multi-agent harvesting pipeline status",
  headings: { running: "Harvester Active", done: "Harvest Complete", failed: "Harvest Failed" },
  stages: STAGES,
  theme: {
    frameDone: "border-coral/60 shadow-coral/20",
    barDone: "bg-coral",
    barRunning: "bg-gradient-to-r from-coral via-gold to-coral animate-pulse",
    badgeDone: "bg-coral/20 text-coral border border-coral/40",
    badgeRunning: "bg-gold/20 text-gold border border-gold/40 animate-pulse",
    chip: "text-coral bg-coral/10 border-coral/20",
    accentText: "text-coral",
    progressFill: "bg-gradient-to-r from-coral to-gold",
    stageActiveBorder: "border-gold/50",
    stageIconDone: "bg-coral/10 text-coral",
    stageIconActive: "bg-gold/10 text-gold",
    markDone: "text-coral",
    markActive: "text-gold",
    doneNote: "text-coral",
    doneLink:
      "inline-flex items-center gap-1.5 bg-coral hover:bg-coral text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg shadow-coral/20 transition-all cursor-pointer",
  },
  runningLine: (_job, stage) => stage.description,
  doneLine: (_job, metadata) => `Found ${typeof metadata.harvestedCount === "number" ? metadata.harvestedCount : 0} new signals`,
  done: { note: "Signals added to Idea Stream", label: "View Stream", href: () => "/ideas" },
  idleNotes: ["You can navigate freely while the harvester scans in the background.", "New topics will appear in your Idea Stream once complete."],
};

export default function HarvestingProgressHUD(props: { job: HarvestingJob | null; onDismiss: () => void }) {
  return <RunProgressHUD {...props} config={CONFIG} />;
}
