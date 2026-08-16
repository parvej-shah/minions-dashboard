"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Search,
  Zap,
  Globe
} from "lucide-react";
import { fetchIdeas } from "@/lib/api";
import { IdeaItem, AudienceLane } from "@/lib/types";

const tradeFilters = ["All Trades", "HVAC", "Plumbing", "Electrical", "Voice AI", "Systems Architecture"];
const laneFilters: ("All" | AudienceLane)[] = ["All", "ICP", "PEER", "BRIDGE"];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [selectedTrade, setSelectedTrade] = useState("All Trades");
  const [selectedLane, setSelectedLane] = useState<"All" | AudienceLane>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInjecting, setIsInjecting] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadIdeas() {
      const data = await fetchIdeas();
      setIdeas(data);
    }
    loadIdeas();
  }, []);

  const filteredIdeas = ideas.filter((idea) => {
    const matchesTrade = selectedTrade === "All Trades" || idea.target_trade.toLowerCase().includes(selectedTrade.toLowerCase());
    const matchesLane = selectedLane === "All" || idea.audience === selectedLane;
    const matchesSearch =
      searchQuery === "" ||
      idea.raw_idea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.angle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrade && matchesLane && matchesSearch;
  });

  const handleCreateDraft = (ideaId: string, title: string) => {
    setNotification(`⚡ Marketing Strategist spawned for: "${title.slice(0, 40)}..."`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInjectIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    const newIdea: IdeaItem = {
      id: `IDEA-000${ideas.length + 1}`,
      raw_idea: newTopic,
      angle: "Manual editorial injection via Cockpit command bar",
      audience: "ICP",
      target_trade: "HVAC",
      pillar: "Operations",
      source: "MANUAL_INJECTION",
      status: "HARVESTED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIdeas([newIdea, ...ideas]);
    setNewTopic("");
    setIsInjecting(false);
    setNotification("✅ Idea successfully injected into Harvester pipeline!");
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#0e5c63] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Signal Ingestion Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12242a]">
            Idea Stream & Harvester
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Continuous discovery from Google Trends, Reddit trade forums, TechCrunch, and competitor intelligence.
          </p>
        </div>

        <button
          onClick={() => setIsInjecting(!isInjecting)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-xs font-semibold text-white shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Inject Manual Topic</span>
        </button>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <Zap className="w-4 h-4 text-[#ff6b4a]" />
          <span>{notification}</span>
        </div>
      )}

      {/* MANUAL INJECTION COLLAPSIBLE BOX */}
      {isInjecting && (
        <form onSubmit={handleInjectIdea} className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#12242a]">Inject High-Signal Topic / Article URL</h3>
            <span className="text-xs text-slate-400 font-mono">Spawns 5-Stage Stripe/Linear Draft</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Why Dallas Plumbing Contractors lose 22% margin during freeze warnings..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#ff6b4a] hover:bg-[#ff522b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Add to Stream
            </button>
          </div>
        </form>
      )}

      {/* FILTER CONTROLS */}
      <div className="p-4 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ideas or keywords..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#faf9f6] border border-[#e5e7eb] text-xs focus:outline-none focus:border-[#0e5c63]"
          />
        </div>

        {/* Trade & Lane Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Trade Filter */}
          <div className="flex items-center gap-1 bg-[#faf9f6] p-1 rounded-xl border border-[#e5e7eb]">
            {tradeFilters.map((trade) => (
              <button
                key={trade}
                onClick={() => setSelectedTrade(trade)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedTrade === trade
                    ? "bg-[#0e5c63] text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-[#12242a]"
                }`}
              >
                {trade}
              </button>
            ))}
          </div>

          {/* Lane Filter */}
          <div className="flex items-center gap-1 bg-[#faf9f6] p-1 rounded-xl border border-[#e5e7eb]">
            {laneFilters.map((lane) => (
              <button
                key={lane}
                onClick={() => setSelectedLane(lane)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedLane === lane
                    ? "bg-[#ff6b4a] text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-[#12242a]"
                }`}
              >
                {lane}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* IDEA CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-50 text-[#0e5c63] border border-teal-100">
                    {idea.audience}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{idea.target_trade}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>{idea.source}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#12242a] group-hover:text-[#0e5c63] transition-colors leading-snug">
                {idea.raw_idea}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">{idea.angle}</p>
            </div>

            <div className="pt-4 border-t border-[#f3f4f6] flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Ingested {new Date(idea.created_at).toLocaleDateString()}
              </span>

              <button
                onClick={() => handleCreateDraft(idea.id, idea.raw_idea)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e5c63] hover:bg-[#0a464c] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-[#ff6b4a]" />
                <span>Refine & Draft</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
