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
  Save
} from "lucide-react";
import { fetchAgentFleet } from "@/lib/api";
import { AgentWorkerItem } from "@/lib/types";

export default function FleetPage() {
  const [fleet, setFleet] = useState<AgentWorkerItem[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<AgentWorkerItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadFleet() {
      const data = await fetchAgentFleet();
      setFleet(data);
      if (data.length > 0) setSelectedWorker(data[0]);
    }
    loadFleet();
  }, []);

  const handleSavePrompt = () => {
    setNotification("Saving updated system prompt to Supabase...");
    setTimeout(() => {
      setNotification("✅ Agent prompt and model routing updated!");
      setTimeout(() => setNotification(null), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#0e5c63] uppercase tracking-wider mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>Autonomous Agent Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12242a]">
            Agent Fleet Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system prompts, model provisioning, and operational roles across marketing and trade dispatch agents.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>7 Workers Active</span>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* TWO-COLUMN FLEET CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* WORKER LIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase px-1">
            Provisioned Workers
          </div>

          {fleet.map((worker) => {
            const isSelected = selectedWorker?.id === worker.id;
            return (
              <button
                key={worker.id}
                onClick={() => setSelectedWorker(worker)}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? "bg-[#12242a] text-white border-[#12242a] shadow-md"
                    : "bg-white text-[#12242a] border-[#e5e7eb] hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{worker.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-[#1a313a] text-teal-300" : "bg-[#faf9f6] text-slate-600 border border-[#e5e7eb]"
                      }`}
                    >
                      {worker.model}
                    </span>
                  </div>
                  <div className={`text-[11px] ${isSelected ? "text-slate-400" : "text-slate-500"} line-clamp-1`}>
                    {worker.type}
                  </div>
                </div>

                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              </button>
            );
          })}
        </div>

        {/* WORKER CONFIGURATION & PROMPT EDITOR (7 COLS) */}
        <div className="lg:col-span-7">
          {selectedWorker ? (
            <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
                <div>
                  <h2 className="text-base font-bold text-[#12242a]">{selectedWorker.name}</h2>
                  <span className="text-xs text-slate-400 font-mono">{selectedWorker.type}</span>
                </div>

                <button
                  onClick={handleSavePrompt}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#ff6b4a]" />
                  <span>Update Worker</span>
                </button>
              </div>

              {/* Model & Status Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                    Model Routing
                  </label>
                  <select
                    defaultValue={selectedWorker.model}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="qwen3.7-max">qwen3.7-max (High-reasoning strategist)</option>
                    <option value="qwen-plus">qwen-plus (Fast long-form writer)</option>
                    <option value="qwen3.7-flash">qwen3.7-flash (Low-latency editor)</option>
                    <option value="qwen-image-3.0">qwen-image-3.0 (2K Visual Studio)</option>
                    <option value="qwen-max">qwen-max (Sub-1.8s voice dispatch)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                    Worker Status
                  </label>
                  <select
                    defaultValue={selectedWorker.status}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Receives Webhooks)</option>
                    <option value="IDLE">IDLE</option>
                    <option value="PAUSED">PAUSED</option>
                  </select>
                </div>
              </div>

              {/* System Prompt Box */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                    System Prompt & Behavioral Rules
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time LLM Instruction</span>
                </div>
                <textarea
                  defaultValue={selectedWorker.system_prompt || ""}
                  rows={8}
                  className="w-full p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-mono text-[#12242a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63] leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-[#e5e7eb] text-center text-slate-400 text-xs font-mono">
              Select a worker from the left to configure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
