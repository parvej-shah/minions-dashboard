"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Zap,
  CheckCircle2,
  Sliders,
  Cpu,
  Clock,
  ShieldCheck,
  Settings,
  Save,
  Activity,
  Sparkles,
  RefreshCw,
  Layers,
  Terminal,
  AlertCircle
} from "lucide-react";
import { fetchAgentFleet } from "@/lib/api";
import { AgentWorkerItem } from "@/lib/types";

const ROLE_BADGE_MAP: Record<string, string> = {
  "WORKER-001": "MARKETING_STRATEGIST",
  "WORKER-002": "CONTENT_WRITER",
  "WORKER-003": "EDITORIAL_REVIEWER",
  "WORKER-004": "VISUAL_ART_DIRECTOR",
  "WORKER-005": "VOICE_DISPATCHER",
  "WORKER-006": "CRM_ENGAGER",
  "WORKER-007": "LOGISTICS_DISPATCH"
};

const WORKER_AVATAR_MAP: Record<string, string> = {
  "WORKER-001": "/images/social-avatars/ai-generated/linkedin_profile_avatar_ai.jpg",
  "WORKER-002": "/images/social-avatars/ai-generated/twitter_profile_avatar_ai.jpg",
  "WORKER-003": "/images/mascots/otto.png",
  "WORKER-004": "/images/social-avatars/ai-generated/github_profile_avatar_ai.jpg",
  "WORKER-005": "/images/mascots/rex.png",
  "WORKER-006": "/images/mascots/pip.png",
  "WORKER-007": "/images/mascots/zip.png",
};

const QWEN_MODELS = [
  { value: "qwen3.7-max", label: "qwen3.7-max (High-reasoning strategist)" },
  { value: "qwen-plus", label: "qwen-plus (Fast long-form writer)" },
  { value: "qwen3.7-flash", label: "qwen3.7-flash (Low-latency editor)" },
  { value: "qwen-image-3.0", label: "qwen-image-3.0 (2K Visual Studio)" },
  { value: "qwen-max", label: "qwen-max (Sub-1.8s voice dispatch)" }
];

export default function FleetPage() {
  const [fleet, setFleet] = useState<AgentWorkerItem[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<AgentWorkerItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for selected worker
  const [editModel, setEditModel] = useState<string>("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "IDLE" | "PAUSED">("ACTIVE");
  const [editPrompt, setEditPrompt] = useState<string>("");

  useEffect(() => {
    async function loadFleet() {
      const data = await fetchAgentFleet();
      setFleet(data);
      if (data.length > 0) {
        setSelectedWorker(data[0]);
        setEditModel(data[0].model);
        setEditStatus(data[0].status);
        setEditPrompt(data[0].system_prompt || "");
      }
    }
    loadFleet();
  }, []);

  const handleSelectWorker = (worker: AgentWorkerItem) => {
    setSelectedWorker(worker);
    setEditModel(worker.model);
    setEditStatus(worker.status);
    setEditPrompt(worker.system_prompt || "");
  };

  const handleUpdateAgent = async () => {
    if (!selectedWorker) return;
    setIsUpdating(true);

    try {
      // Trigger API update per PRD (PUT /api/agents/:id)
      const res = await fetch(`/api/agents/${selectedWorker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: editModel,
          status: editStatus,
          system_prompt: editPrompt
        })
      });

      // Update local state
      const updatedFleet = fleet.map((w) =>
        w.id === selectedWorker.id
          ? {
              ...w,
              model: editModel,
              status: editStatus,
              system_prompt: editPrompt,
              last_active: "Just now"
            }
          : w
      );

      setFleet(updatedFleet);
      setSelectedWorker({
        ...selectedWorker,
        model: editModel,
        status: editStatus,
        system_prompt: editPrompt,
        last_active: "Just now"
      });

      setNotification(`Agent ${selectedWorker.name} updated. Prompt synced to n8n runtime.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification(`Failed to update ${selectedWorker.name}.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeCount = fleet.filter((w) => w.status === "ACTIVE").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HEADER & FLEET HEALTH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>Multi-Agent Autonomous Fleet</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Agent Fleet Manager
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage system prompts, model provisioning, and operational status across marketing and dispatch workers.
          </p>
        </div>

        {/* Fleet Health Indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#0F1419] px-4 py-2 rounded-xl border border-[#1F2D3D]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C9A7] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#F1F5F9]">
              {activeCount} of {fleet.length} Active
            </span>
          </div>
          <span className="text-[#1F2D3D]">|</span>
          <span className="text-xs font-mono text-[#00C9A7] font-semibold">
            100% Fleet Health
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-[#0F1419] border border-[#00C9A7]/40 text-xs font-medium flex items-center justify-between shadow-lg shadow-[#00C9A7]/5">
          <div className="flex items-center gap-2.5 text-[#F1F5F9]">
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
            <span>{notification}</span>
          </div>
          <span className="text-[11px] font-mono text-[#00C9A7] uppercase tracking-wider">Live Synced</span>
        </div>
      )}

      {/* TWO-COLUMN SPLIT PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: VERTICAL LIST OF 7 AGENT CARDS (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-[#94A3B8]">
            <span className="uppercase tracking-wider">PROVISIONED WORKERS ({fleet.length})</span>
            <span>MODEL ROUTING</span>
          </div>

          <div className="space-y-2.5">
            {fleet.map((worker) => {
              const isSelected = selectedWorker?.id === worker.id;
              const roleBadge = ROLE_BADGE_MAP[worker.id] || worker.role.toUpperCase().replace(/\s+/g, "_").slice(0, 18);

              return (
                <button
                  key={worker.id}
                  onClick={() => handleSelectWorker(worker)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer group flex flex-col gap-2.5 ${
                    isSelected
                      ? "bg-[#161D26] border-[#00C9A7] shadow-lg shadow-[#00C9A7]/5 ring-1 ring-[#00C9A7]/30"
                      : "bg-[#0F1419] border-[#1F2D3D] hover:bg-[#161D26]/70 hover:border-[#2A3D52]"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      {/* Avatar Thumbnail */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#070B0F] border border-[#1F2D3D] shrink-0 flex items-center justify-center">
                        <img
                          src={WORKER_AVATAR_MAP[worker.id] || "/images/mascots/rex.png"}
                          alt={worker.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#64748B] font-bold">
                            {worker.id}
                          </span>
                          <h3 className={`text-sm font-bold transition-colors truncate ${
                            isSelected ? "text-[#00C9A7]" : "text-[#F1F5F9] group-hover:text-[#00C9A7]"
                          }`}>
                            {worker.name}
                          </h3>
                        </div>
                        <p className="text-xs text-[#94A3B8] line-clamp-1">
                          {worker.role}
                        </p>
                      </div>
                    </div>

                    {/* Status Dot */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          worker.status === "ACTIVE"
                            ? "bg-[#00C9A7] shadow-[0_0_8px_#00C9A7]"
                            : worker.status === "PAUSED"
                            ? "bg-[#F59E0B]"
                            : "bg-[#64748B]"
                        }`}
                      />
                      <span className="text-[10px] font-mono uppercase text-[#94A3B8]">
                        {worker.status}
                      </span>
                    </div>
                  </div>

                  {/* Badges & Timestamp */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F2D3D]/50 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1E2733] text-[#00C9A7] px-2 py-0.5 rounded text-[10px] font-semibold border border-[#1F2D3D]">
                        {roleBadge}
                      </span>
                      <span className="bg-[#070B0F] text-[#94A3B8] px-2 py-0.5 rounded text-[10px] border border-[#1F2D3D]">
                        {worker.model}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#64748B]">
                      {worker.last_active || "Active"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED AGENT DETAIL EDITOR (7 COLS) */}
        <div className="lg:col-span-7">
          {selectedWorker ? (
            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-6 shadow-sm">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2D3D]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#070B0F] border border-[#00C9A7]/40 shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={WORKER_AVATAR_MAP[selectedWorker.id] || "/images/mascots/rex.png"}
                      alt={selectedWorker.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#00C9A7]">
                        {selectedWorker.id}
                      </span>
                      <span className="text-[#64748B]">·</span>
                      <span className="text-xs font-mono text-[#94A3B8]">
                        {ROLE_BADGE_MAP[selectedWorker.id] || "AGENT_WORKER"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#F1F5F9] mt-0.5">
                      {selectedWorker.name}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={handleUpdateAgent}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold shadow-lg shadow-[#00C9A7]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Update Agent</span>
                    </>
                  )}
                </button>
              </div>

              {/* Read-Only Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase">
                    Agent Name
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs font-medium text-[#F1F5F9]">
                    {selectedWorker.name}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase">
                    Operational Role
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs font-medium text-[#94A3B8] truncate">
                    {selectedWorker.role}
                  </div>
                </div>
              </div>

              {/* Model Dropdown & Status Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase flex items-center justify-between">
                    <span>Model Routing</span>
                    <span className="text-[10px] text-[#00C9A7]">DashScope</span>
                  </label>
                  <select
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7] transition-all cursor-pointer"
                  >
                    {QWEN_MODELS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#0F1419] text-[#F1F5F9]">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase">
                    Operational Status
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#161D26] p-1 rounded-xl border border-[#1F2D3D]">
                    {(["ACTIVE", "IDLE", "PAUSED"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          editStatus === st
                            ? st === "ACTIVE"
                              ? "bg-[#00C9A7] text-[#070B0F]"
                              : st === "PAUSED"
                              ? "bg-[#F59E0B] text-[#070B0F]"
                              : "bg-[#64748B] text-[#F1F5F9]"
                            : "text-[#94A3B8] hover:text-[#F1F5F9]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Prompt & Behavioral Rules Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#00C9A7]" />
                    <span>System Prompt & Behavioral Rules — Real-time LLM Instruction</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#00C9A7]">
                    Live Prompt Injection
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8]">
                  Any update here is immediately used on the next n8n workflow run. Enter strict rules, banned lexicon references, and output format constraints.
                </p>

                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={10}
                  className="w-full p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7] focus:ring-1 focus:ring-[#00C9A7]/20 leading-relaxed transition-all resize-y"
                  placeholder="Enter system prompt for this agent worker..."
                />
              </div>

              {/* Footer Audit Notice */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1F2D3D]/50 text-xs font-mono text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>Config endpoint: GET /api/agents</span>
                </div>
                <span>Total Lifetime Runs: {selectedWorker.total_runs}</span>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-center text-[#94A3B8] text-xs font-mono">
              Select an agent from the left panel to edit configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
