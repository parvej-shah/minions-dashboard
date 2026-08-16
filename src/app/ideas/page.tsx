"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Filter, 
  ArrowUpRight, 
  Radio, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Flame, 
  Layers, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Send,
  SlidersHorizontal,
  X
} from "lucide-react";
import { IdeaItem, AudienceLane, TargetTrade, ContentPillar, IdeaSource } from "@/lib/types";
import { INITIAL_IDEAS } from "@/lib/api";

const TRADES: TargetTrade[] = [
  "HVAC", 
  "Plumbing", 
  "Electrical", 
  "Roofing", 
  "Pest Control", 
  "Voice AI", 
  "Systems Architecture", 
  "Operations"
];

const AUDIENCES: AudienceLane[] = ["ICP", "PEER", "BRIDGE"];

export default function IdeaStreamPage() {
  const [ideas, setIdeas] = useState<IdeaItem[]>(INITIAL_IDEAS);
  const [selectedTrade, setSelectedTrade] = useState<string>("ALL");
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [isDraftingId, setIsDraftingId] = useState<string | null>(null);
  const [draftSuccessId, setDraftSuccessId] = useState<string | null>(null);

  // New Idea Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAngle, setNewAngle] = useState("");
  const [newTrade, setNewTrade] = useState<TargetTrade>("HVAC");
  const [newAudience, setNewAudience] = useState<AudienceLane>("ICP");
  const [newPillar, setNewPillar] = useState<ContentPillar>("Operations");
  const [newSource, setNewSource] = useState<IdeaSource>("MANUAL_INJECTION");

  const handleInjectIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: IdeaItem = {
      id: `IDEA-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      raw_idea: newTitle.trim(),
      angle: newAngle.trim() || "Operational and unit economics analysis for contractors",
      audience: newAudience,
      target_trade: newTrade,
      pillar: newPillar,
      source: newSource,
      status: "HARVESTED",
      estimated_cost: 0.038,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setIdeas([created, ...ideas]);
    setShowInjectModal(false);
    setNewTitle("");
    setNewAngle("");
  };

  const handleRefineAndDraft = (ideaId: string) => {
    setIsDraftingId(ideaId);
    setTimeout(() => {
      setIsDraftingId(null);
      setDraftSuccessId(ideaId);
      setIdeas(prev => prev.map(item => item.id === ideaId ? { ...item, status: "DRAFTING" } : item));
    }, 1500);
  };

  const filteredIdeas = ideas.filter(idea => {
    if (selectedTrade !== "ALL" && idea.target_trade !== selectedTrade) return false;
    if (selectedAudience !== "ALL" && idea.audience !== selectedAudience) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        idea.raw_idea.toLowerCase().includes(q) ||
        idea.angle.toLowerCase().includes(q) ||
        idea.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-primary uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Signal Ingestion Hub
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Idea Stream & Harvester
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Continuous discovery from Google Trends, Reddit trade forums, TechCrunch, and competitor intelligence.
          </p>
        </div>

        <button
          onClick={() => setShowInjectModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Inject Manual Topic
        </button>
      </div>

      {/* Manual Injection Modal */}
      {showInjectModal && (
        <div className="bg-card p-6 rounded-2xl border border-primary/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Inject New Market Signal / Editorial Topic
            </h3>
            <button 
              onClick={() => setShowInjectModal(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleInjectIdea} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target Trade</label>
                <select
                  value={newTrade}
                  onChange={(e) => setNewTrade(e.target.value as TargetTrade)}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  {TRADES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Audience Tier</label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value as AudienceLane)}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  <option value="ICP">ICP (Home Service Contractors)</option>
                  <option value="PEER">PEER (Systems & AI Architects)</option>
                  <option value="BRIDGE">BRIDGE (Cross-Industry)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Content Pillar</label>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as ContentPillar)}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  <option value="Operations">Operations</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Revenue">Revenue & Unit Economics</option>
                  <option value="Field Playbook">Field Playbook</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Signal Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as IdeaSource)}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground"
                >
                  <option value="MANUAL_INJECTION">Operator Manual Injection</option>
                  <option value="GOOGLE_TRENDS">Google Trends Search</option>
                  <option value="REDDIT_R_LOCALLAMA">Reddit r/HVAC or r/LocalLLaMA</option>
                  <option value="HACKER_NEWS">Hacker News Discussion</option>
                  <option value="TRADE_NEWS">ACHR News / Trade Publication</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Raw Idea / Topic Headline</label>
              <input
                type="text"
                placeholder="e.g. Sub-1.8s Voice Pickup: How HVAC Emergency Intake Beats Voicemail Churn"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-xs text-foreground font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Angle & Strategic Thesis</label>
              <textarea
                rows={2}
                placeholder="Why does this matter? What is the friction, the numbers, or the contrarian operator insight?"
                value={newAngle}
                onChange={(e) => setNewAngle(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-xl p-3 text-xs text-foreground resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInjectModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs shadow-sm"
              >
                Inject into Active Stream
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-card/40 p-4 rounded-2xl border border-border/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ideas, keywords, or angles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/80 border border-border/40 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">Audience:</span>
            <button
              onClick={() => setSelectedAudience("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedAudience === "ALL" ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {AUDIENCES.map(a => (
              <button
                key={a}
                onClick={() => setSelectedAudience(a)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedAudience === a ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/20">
          <span className="text-[11px] font-mono text-muted-foreground shrink-0">Trade:</span>
          <button
            onClick={() => setSelectedTrade("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              selectedTrade === "ALL" ? "bg-primary/20 text-primary border border-primary/40 font-bold" : "bg-background/40 border border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Trades ({ideas.length})
          </button>
          {TRADES.map(trade => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedTrade === trade ? "bg-primary/20 text-primary border border-primary/40 font-bold" : "bg-background/40 border border-border/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {trade}
            </button>
          ))}
        </div>
      </div>

      {/* Idea Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIdeas.map((idea) => {
          const isICP = idea.audience === "ICP";
          const isDrafting = isDraftingId === idea.id;
          const isSuccess = draftSuccessId === idea.id;

          return (
            <div
              key={idea.id}
              className="bg-card/70 hover:bg-card/90 rounded-2xl border border-border/40 hover:border-primary/40 p-5 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isICP ? "bg-primary/10 text-primary border border-primary/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    }`}>
                      {idea.audience}
                    </span>
                    <span className="text-[10px] font-mono bg-muted/40 text-muted-foreground px-2 py-0.5 rounded border border-border/30">
                      {idea.target_trade}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {idea.source}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{idea.id}</span>
                </div>

                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {idea.raw_idea}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {idea.angle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/20">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Ingested {new Date(idea.created_at).toLocaleDateString()}
                </span>

                {isSuccess ? (
                  <Link
                    href="/drafts/ASSET-0004"
                    className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Open Staged Draft ↗
                  </Link>
                ) : (
                  <button
                    onClick={() => handleRefineAndDraft(idea.id)}
                    disabled={isDrafting}
                    className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isDrafting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Spawning Strategist...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Refine & Draft
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
