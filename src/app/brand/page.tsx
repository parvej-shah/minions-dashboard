"use client";

import { useState, useEffect } from "react";
import { 
  Palette, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Check, 
  Copy, 
  BookOpen, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Sliders, 
  Layers, 
  Terminal, 
  FileText, 
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send
} from "lucide-react";
import { BrandDirectiveItem, BrandCategory, BrandSettings } from "@/lib/types";
import { INITIAL_BRAND_DIRECTIVES, fetchBrandSettings } from "@/lib/api";

const CATEGORIES: { label: string; value: BrandCategory; desc: string }[] = [
  { label: "Identity & Name", value: "IDENTITY", desc: "Core naming rules and company definition" },
  { label: "Forbidden & Banned", value: "FORBIDDEN", desc: "Strictly banned phrases, fake accounts & words" },
  { label: "Allowed Proof", value: "PROOF", desc: "Verifiable technical claims & live demos" },
  { label: "ICP Pain Points", value: "ICP_PAIN", desc: "Real HVAC/Plumbing/Electrical field friction" },
  { label: "Voice DOs", value: "VOICE_DO", desc: "Stripe/Linear cadence & operator examples" },
  { label: "Voice DONTs", value: "VOICE_DONT", desc: "No AI cheerleading or fluff paragraphs" },
  { label: "Peer Stance", value: "PEER_STANCE", desc: "Engineering positions on deterministic systems" },
  { label: "Objections", value: "OBJECTION", desc: "Handling contractor skepticism" },
  { label: "Calls to Action", value: "CTA", desc: "Approved closing actions & test line" }
];

export default function BrandStudioPage() {
  const [activeTab, setActiveTab] = useState<"directives" | "multi_brand" | "visuals" | "lexicon">("directives");
  const [directives, setDirectives] = useState<BrandDirectiveItem[]>(INITIAL_BRAND_DIRECTIVES);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<number | "ALL">("ALL");
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // New directive form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState<BrandCategory>("VOICE_DO");
  const [newKey, setNewKey] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<1 | 2 | 3>(1);
  const [newAudience, setNewAudience] = useState<"ALL" | "ICP" | "PEER" | "BRIDGE">("ALL");

  // Multi-brand instruction state
  const [selectedBrand, setSelectedBrand] = useState("getminions.ai");
  const [operatorPrompt, setOperatorPrompt] = useState(
    "Always maintain a technical, tactile tone. Treat the reader as an intelligent trade contractor or software architect who respects physics, concrete numbers, and real error logs. Never speak like a marketer."
  );
  const [promptSaved, setPromptSaved] = useState(false);

  // Banned lexicon list
  const [bannedWords, setBannedWords] = useState([
    "delve", "testament", "tapestry", "seamless", "game-changing", 
    "revolutionize", "unlock", "synergy", "in today's fast-paced world", 
    "the future of", "leverage", "supercharge", "🚀", "💡"
  ]);
  const [newBannedWord, setNewBannedWord] = useState("");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newContent) return;

    const item: BrandDirectiveItem = {
      id: `DIR-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      category: newCat,
      key: newKey.toLowerCase().replace(/\s+/g, "_"),
      content: newContent,
      priority: newPriority,
      audience_scope: newAudience,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    setDirectives([item, ...directives]);
    setShowAddModal(false);
    setNewKey("");
    setNewContent("");
  };

  const toggleDirective = (id: string) => {
    setDirectives(directives.map(d => d.id === id ? { ...d, is_active: !d.is_active } : d));
  };

  const deleteDirective = (id: string) => {
    setDirectives(directives.filter(d => d.id !== id));
  };

  const handleAddBannedWord = () => {
    if (newBannedWord && !bannedWords.includes(newBannedWord.trim().toLowerCase())) {
      setBannedWords([...bannedWords, newBannedWord.trim().toLowerCase()]);
      setNewBannedWord("");
    }
  };

  const removeBannedWord = (word: string) => {
    setBannedWords(bannedWords.filter(w => w !== word));
  };

  const filteredDirectives = directives.filter(d => {
    if (selectedCategory !== "ALL" && d.category !== selectedCategory) return false;
    if (selectedPriority !== "ALL" && d.priority !== selectedPriority) return false;
    if (selectedAudience !== "ALL" && d.audience_scope !== selectedAudience) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-primary uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Brand Governance & Context Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Brand Guidelines & Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Replaces the Google Sheet <code className="text-primary font-mono">brand</code> tab. Manage active directives, tone constraints, banned lexicon, and instruct agents across all brands.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-card/60 p-1 rounded-xl border border-border/40 backdrop-blur-sm self-start md:self-auto">
          <button
            onClick={() => setActiveTab("directives")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "directives"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sheet Directives ({directives.length})
          </button>
          <button
            onClick={() => setActiveTab("multi_brand")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "multi_brand"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Instruct Agents
          </button>
          <button
            onClick={() => setActiveTab("lexicon")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "lexicon"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Banned Lexicon ({bannedWords.length})
          </button>
          <button
            onClick={() => setActiveTab("visuals")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "visuals"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Visuals & R2
          </button>
        </div>
      </div>

      {/* TAB 1: GOOGLE SHEET BRAND DIRECTIVES */}
      {activeTab === "directives" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 p-4 rounded-xl border border-border/40">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-background/80 border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Categories ({directives.length})</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={String(selectedPriority)}
                onChange={(e) => setSelectedPriority(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-background/80 border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Priorities</option>
                <option value="1">Priority 1 (Always Loaded)</option>
                <option value="2">Priority 2 (Category Relevant)</option>
                <option value="3">Priority 3 (Contextual)</option>
              </select>

              {/* Audience Scope */}
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-background/80 border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Audience Scopes</option>
                <option value="ICP">ICP (Home Service Contractors)</option>
                <option value="PEER">PEER (Systems & AI Engineers)</option>
                <option value="BRIDGE">BRIDGE (Cross-Disciplinary)</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Brand Directive
            </button>
          </div>

          {/* Add Directive Modal */}
          {showAddModal && (
            <div className="bg-card p-6 rounded-2xl border border-primary/30 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  New Brand Directive (Sheets `brand` Tab Row)
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleAddDirective} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Category</label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value as BrandCategory)}
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Key (Slug)</label>
                    <input
                      type="text"
                      placeholder="e.g. attic_thermal_leak"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      required
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(Number(e.target.value) as 1 | 2 | 3)}
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground"
                    >
                      <option value={1}>1 (Always Loaded into Prompts)</option>
                      <option value={2}>2 (Loaded for Matching Category)</option>
                      <option value={3}>3 (Contextual / Edge Case)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Audience Scope</label>
                    <select
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value as any)}
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground"
                    >
                      <option value="ALL">ALL (Every Audience)</option>
                      <option value="ICP">ICP (Contractors & Operators)</option>
                      <option value="PEER">PEER (Systems & AI Engineers)</option>
                      <option value="BRIDGE">BRIDGE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Content (Instruction or Example)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the concrete brand instruction, rule, or example..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    className="w-full bg-background border border-border/60 rounded-lg p-3 text-xs text-foreground resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs shadow-sm"
                  >
                    Save Directive to Active Memory
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directives Table / Cards */}
          <div className="grid grid-cols-1 gap-3">
            {filteredDirectives.map((directive) => {
              const isForbidden = directive.category === "FORBIDDEN";
              const isProof = directive.category === "PROOF";
              const isVoice = directive.category === "VOICE_DO" || directive.category === "VOICE_DONT";

              return (
                <div
                  key={directive.id}
                  className={`p-4 rounded-xl border transition-all ${
                    directive.is_active 
                      ? isForbidden 
                        ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50" 
                        : isProof
                          ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50"
                          : "bg-card/70 border-border/40 hover:border-primary/40"
                      : "bg-muted/10 border-border/20 opacity-50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isForbidden 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : isProof
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : isVoice
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-primary/20 text-primary border border-primary/30"
                      }`}>
                        {directive.category}
                      </span>

                      <span className="text-xs font-mono font-semibold text-foreground">
                        {directive.key}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/30">
                        Priority {directive.priority}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/30">
                        Scope: {directive.audience_scope}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => toggleDirective(directive.id)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded transition-all ${
                          directive.is_active
                            ? "text-emerald-400 hover:bg-emerald-500/10"
                            : "text-muted-foreground hover:bg-muted/20"
                        }`}
                      >
                        {directive.is_active ? "● Active" : "○ Disabled"}
                      </button>

                      <button
                        onClick={() => copyToClipboard(directive.content, directive.id)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        title="Copy content"
                      >
                        {copiedKey === directive.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => deleteDirective(directive.id)}
                        className="text-muted-foreground hover:text-red-400 p-1"
                        title="Delete directive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed font-sans mt-2 bg-background/40 p-2.5 rounded-lg border border-border/20">
                    {directive.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INSTRUCT AGENTS / MULTI-BRAND INSTRUCTION */}
      {activeTab === "multi_brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card/70 p-6 rounded-2xl border border-border/40 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" />
                    Direct Brand & Mission Dispatcher
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Write high-priority operator instructions that will be injected into all autonomous agent prompts (Strategist, Writer, Editor, Art Director).
                  </p>
                </div>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground font-medium"
                >
                  <option value="getminions.ai">getminions.ai (Primary Ops)</option>
                  <option value="minions_voice_demo">Minions Voice AI Demo</option>
                  <option value="minions_enterprise">Minions Enterprise Field Ops</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Operator System Directive</span>
                  <span className="text-[11px] font-mono text-muted-foreground">Injected before Stage 1 Reasoning</span>
                </label>
                <textarea
                  rows={6}
                  value={operatorPrompt}
                  onChange={(e) => {
                    setOperatorPrompt(e.target.value);
                    setPromptSaved(false);
                  }}
                  className="w-full bg-background border border-border/60 rounded-xl p-4 text-xs font-mono text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {promptSaved ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Synchronized to all 7 agent workers
                    </span>
                  ) : (
                    <span>Click save to broadcast new directives to the active agent fleet</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setPromptSaved(true);
                    setTimeout(() => setPromptSaved(false), 3000);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Save & Broadcast to Fleet
                </button>
              </div>
            </div>

            {/* Injected Context Preview */}
            <div className="bg-card/40 p-5 rounded-2xl border border-border/30 space-y-3">
              <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                Live Agent Ingestion Preview (What the LLM Sees)
              </h4>
              <pre className="bg-black/50 p-3.5 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-border/20">
{`=== BRAND CONTEXT INJECTION [${selectedBrand.toUpperCase()}] ===
Company Name: getminions.ai (lowercase, .ai suffix)
Positioning: AI operations partner for US home-services businesses (1-10 techs)
Tone: Technical, tactile operator prose. 1-3 sentences per paragraph.
Operator Directive: "${operatorPrompt}"
Forbidden Words: [${bannedWords.slice(0, 8).join(", ")}...]
Allowed Proof: Live callable demo number, RAG chatbot, deterministic Go schema.`}
              </pre>
            </div>
          </div>

          {/* Right sidebar: Quick Persona Cards */}
          <div className="space-y-4">
            <div className="bg-card/60 p-5 rounded-2xl border border-border/40 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase font-mono tracking-wider">
                Audience Persona Lanes
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-background/60 border border-primary/20">
                  <div className="flex items-center justify-between text-xs font-bold text-primary mb-1">
                    <span>ICP: Operators</span>
                    <span className="text-[10px] font-mono bg-primary/10 px-1.5 py-0.5 rounded">Primary</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    US home service contractors (HVAC, plumbing, electrical) with 1–10 vans. Motivated by speed-to-lead, technician overtime reduction, and zero warranty callbacks.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background/60 border border-cyan-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1">
                    <span>PEER: Systems Engineers</span>
                    <span className="text-[10px] font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">Technical</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    CTOs, AI architects, and multi-agent system developers. Motivated by deterministic schema validation, sub-1.8s audio latency, and production reliability.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background/60 border border-amber-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                    <span>BRIDGE: Mixed</span>
                    <span className="text-[10px] font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">Hybrid</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Tech-forward trade owners exploring AI automation for the first time. Need simple ROI explanations grounded in real field physics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BANNED LEXICON & COMPLIANCE */}
      {activeTab === "lexicon" && (
        <div className="space-y-6">
          <div className="bg-card/70 p-6 rounded-2xl border border-border/40 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Banned Lexicon & AI Cliché Blacklist
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The Lead Editorial Reviewer rejects or auto-edits any draft containing these words.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add banned buzzword..."
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBannedWord()}
                  className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleAddBannedWord}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  + Ban Word
                </button>
              </div>
            </div>

            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-2 pt-2">
              {bannedWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono px-3 py-1.5 rounded-lg"
                >
                  <span>"{word}"</span>
                  <button
                    onClick={() => removeBannedWord(word)}
                    className="text-red-400 hover:text-red-200 transition-colors ml-1"
                    title="Remove from blacklist"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/40 p-5 rounded-2xl border border-border/30 space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase font-mono">Why We Ban These Terms</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generic AI copy uses empty filler words like <em>"seamless"</em> and <em>"game-changing"</em> that destroy credibility with blue-collar trade operators. By banning them at the prompt and review gates, our content maintains high technical density and authenticity.
              </p>
            </div>

            <div className="bg-card/40 p-5 rounded-2xl border border-border/30 space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase font-mono">Automated Linter Action</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When a draft is generated, Stage 3 (Lead Editorial Reviewer) scans for banned lexicon. Any violation automatically triggers a red flag in the Draft Reviewer claims checklist.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VISUALS & R2 ASSET STUDIO */}
      {activeTab === "visuals" && (
        <div className="space-y-6">
          {/* Brand Palette Swatches */}
          <div className="bg-card/70 p-6 rounded-2xl border border-border/40 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Official Brand Color Tokens
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-background/60 border border-border/30 space-y-2">
                <div className="h-10 rounded-lg bg-[#12242a] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Deep Slate Ink</span>
                  <button 
                    onClick={() => copyToClipboard("#12242a", "slate")}
                    className="text-muted-foreground hover:text-primary font-mono text-[10px]"
                  >
                    {copiedKey === "slate" ? "Copied" : "#12242a"}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-background/60 border border-border/30 space-y-2">
                <div className="h-10 rounded-lg bg-[#0e5c63] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Brand Teal</span>
                  <button 
                    onClick={() => copyToClipboard("#0e5c63", "teal")}
                    className="text-muted-foreground hover:text-primary font-mono text-[10px]"
                  >
                    {copiedKey === "teal" ? "Copied" : "#0e5c63"}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-background/60 border border-border/30 space-y-2">
                <div className="h-10 rounded-lg bg-[#ff6b4a] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Vibrant Coral</span>
                  <button 
                    onClick={() => copyToClipboard("#ff6b4a", "coral")}
                    className="text-muted-foreground hover:text-primary font-mono text-[10px]"
                  >
                    {copiedKey === "coral" ? "Copied" : "#ff6b4a"}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-background/60 border border-border/30 space-y-2">
                <div className="h-10 rounded-lg bg-[#fff8f0] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Cream Canvas</span>
                  <button 
                    onClick={() => copyToClipboard("#fff8f0", "cream")}
                    className="text-muted-foreground hover:text-primary font-mono text-[10px]"
                  >
                    {copiedKey === "cream" ? "Copied" : "#fff8f0"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Qwen Cover Formula */}
          <div className="bg-card/70 p-6 rounded-2xl border border-border/40 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Qwen Image 3.0 Cover Formula Rules
            </h3>
            <p className="text-xs text-muted-foreground">
              Every cover generated by Visual Art Director follows this exact formula for consistent Stripe/Linear editorial luxury:
            </p>

            <pre className="bg-black/50 p-4 rounded-xl text-xs font-mono text-primary leading-relaxed overflow-x-auto border border-border/30">
{`Prompt Structure:
1. Composition: Tactile studio flat-lay with real stitched leather clipboard & metallic clip.
2. Typography: Clean bold title in pure uppercase (3–6 words max), centered on paper.
3. Badge: [ARCHITECT] or [OPERATIONS] badge above headline in brand coral (#ff6b4a).
4. Wordmark: "Minions.AI" rendered in top right corner.
5. Lighting: Crisp directional studio rim lighting with subtle teal vignette. No sci-fi glowing dust.`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
