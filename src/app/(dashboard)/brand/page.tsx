"use client";

import {
  useState,
} from "react";
import {
  Palette,
  Check,
  Copy,
  BookOpen,
  AlertTriangle,
  Plus,
  Trash2,
  Share2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { BrandDirectiveItem, BrandCategory, AudienceScope, BrandTab } from "@/types";
import {
  CATEGORIES,
  SOCIAL_TEMPLATES,
} from "@/constants/brandAssets";
import { BRAND_PRESETS } from "@/constants/brandPresets";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import VisualsTab from "@/components/brand/VisualsTab";
import MascotsTab from "@/components/brand/MascotsTab";
import SocialTemplatesTab from "@/components/brand/SocialTemplatesTab";
import LexiconTab from "@/components/brand/LexiconTab";
import ProfileTab from "@/components/brand/ProfileTab";
import { useApiResource } from "@/hooks/useApiResource";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export default function BrandStudioPage() {
  const [activeTab, setActiveTab] = useState<BrandTab>("profile");
  const {
    data: directives,
    isLoading: directivesLoading,
    setData: setDirectives,
  } = useApiResource<BrandDirectiveItem[]>("/api/brand/directives", [], {
    errorMessage: "Could not load brand directives",
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<number | "ALL">("ALL");
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
  const { copiedKey, copy: copyToClipboard } = useCopyToClipboard();

  const [logoBgMode, setLogoBgMode] = useState<"dark" | "white" | "teal" | "checker">("dark");
  const [activeLogoVariant, setActiveLogoVariant] = useState<"inverted" | "primary" | "teal">("inverted");

  // Social Template State
  const [socialPlatformFilter, setSocialPlatformFilter] = useState<string>("ALL");
  const [socialTypeFilter, setSocialTypeFilter] = useState<"ALL" | "COVER" | "AVATAR">("ALL");

  // Cover Reference Templates
  // Directives Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [newCat, setNewCat] = useState<BrandCategory>("VOICE_DO");
  const [newKey, setNewKey] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<1 | 2 | 3>(1);
  const [newAudience, setNewAudience] = useState<"ALL" | "ICP" | "PEER" | "BRIDGE">("ALL");

  // Banned lexicon: derived from the same FORBIDDEN-category BrandDirective rows the
  // Directives tab and the drafting pipeline use -- not a separate, disconnected list.
  const forbiddenDirectives = directives.filter(d => d.category === "FORBIDDEN");
  const [newBannedWord, setNewBannedWord] = useState("");

  const handleApplyPreset = async (presetId: string) => {
    setApplyingPreset(true);
    try {
      const res = await fetch("/api/brand/directives/preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.directives) {
          setDirectives(data.directives);
        }
      }
    } catch {
      // Direct error handling
    } finally {
      setApplyingPreset(false);
      setShowPresetModal(false);
    }
  };

  const handleAddDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent) return;
    const finalKey = newKey.trim() || newContent.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 4).join("_") || "directive_rule";

    try {
      const res = await fetch("/api/brand/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCat,
          key: finalKey,
          content: newContent,
          priority: newPriority,
          audience_scope: newAudience
        })
      });
      if (res.ok) {
        const created: BrandDirectiveItem = await res.json();
        setDirectives(prev => [created, ...prev]);
      }
    } catch {
      // No local fallback: a directive that only exists client-side would silently
      // never reach the pipeline's actual brand context query.
    } finally {
      setShowAddModal(false);
      setNewKey("");
      setNewContent("");
    }
  };

  const toggleDirective = async (id: string) => {
    const target = directives.find(d => d.id === id);
    if (!target) return;
    const nextActive = !target.is_active;
    setDirectives(directives.map(d => d.id === id ? { ...d, is_active: nextActive } : d));
    try {
      await fetch(`/api/brand/directives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive })
      });
    } catch {
      // Revert on failure so the UI never claims a state the DB doesn't have
      setDirectives(directives.map(d => d.id === id ? { ...d, is_active: !nextActive } : d));
    }
  };

  const deleteDirective = async (id: string) => {
    const previous = directives;
    setDirectives(directives.filter(d => d.id !== id));
    try {
      const res = await fetch(`/api/brand/directives/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setDirectives(previous);
    }
  };

  const handleAddBannedWord = async () => {
    const word = newBannedWord.trim();
    if (!word) return;
    try {
      const res = await fetch("/api/brand/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "FORBIDDEN",
          key: word,
          content: word,
          priority: 1,
          audience_scope: "ALL",
        }),
      });
      if (res.ok) {
        const created: BrandDirectiveItem = await res.json();
        setDirectives(prev => [created, ...prev]);
      }
    } catch {
      // No local fallback: a banned word that only exists client-side would silently
      // never reach the pipeline's actual brand context query.
    } finally {
      setNewBannedWord("");
    }
  };

  const removeBannedWord = (id: string) => deleteDirective(id);

  const filteredDirectives = directives.filter(d => {
    if (selectedCategory !== "ALL" && d.category !== selectedCategory) return false;
    if (selectedPriority !== "ALL" && d.priority !== selectedPriority) return false;
    if (selectedAudience !== "ALL" && d.audience_scope !== selectedAudience) return false;
    return true;
  });

  // Current active logo path
  

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Brand Governance & Visual Asset Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Brand & Directives
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage your brand identity, visual assets, social covers, and live LLM prompt directives.
          </p>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex flex-wrap items-center bg-[#0F1419] p-1 rounded-xl border border-[#1F2D3D] self-start md:self-auto gap-1 max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Brand Profile
          </button>
          <button
            onClick={() => setActiveTab("directives")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "directives"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Brand Directives ({directives.length})
          </button>
          <button
            onClick={() => setActiveTab("lexicon")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "lexicon"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Banned Buzzwords ({forbiddenDirectives.length})
          </button>
          <button
            onClick={() => setActiveTab("visuals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "visuals"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Visual Assets
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "social"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Social Covers
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 0: BRAND PROFILE (company info, voice, colors, logo) */}
      {/* ======================================================== */}
      {activeTab === "profile" && <ProfileTab />}

      {/* ======================================================== */}
      {/* TAB 1: VISUALS & LOGO STUDIO */}
      {/* ======================================================== */}
      {activeTab === "visuals" && (
        <VisualsTab logoBgMode={logoBgMode} setLogoBgMode={setLogoBgMode} activeLogoVariant={activeLogoVariant} setActiveLogoVariant={setActiveLogoVariant} currentLogoSrc="" setActiveTab={setActiveTab} copiedKey={copiedKey} copyToClipboard={copyToClipboard} />
      )}

      {/* ======================================================== */}
      {/* TAB 2: THE MASCOT SQUAD SHOWCASE */}
      {/* ======================================================== */}
      {activeTab === "mascots" && (
        <MascotsTab />
      )}

      {/* ======================================================== */}
      {/* TAB 3: SOCIAL AVATARS & COVERS SELECTOR */}
      {/* ======================================================== */}
      {activeTab === "social" && (
        <SocialTemplatesTab />
      )}

      {/* ======================================================== */}
      {/* TAB 4: DIRECTIVES TABLE */}
      {/* ======================================================== */}
      {activeTab === "directives" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F1419] p-4 rounded-2xl border border-[#1F2D3D]">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
              >
                <option value="ALL">All Categories ({directives.length})</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <select
                value={String(selectedPriority)}
                onChange={(e) => setSelectedPriority(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
              >
                <option value="ALL">All Priorities</option>
                <option value="1">Priority 1 (Always Loaded)</option>
                <option value="2">Priority 2 (Category Relevant)</option>
                <option value="3">Priority 3 (Contextual)</option>
              </select>

              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
              >
                <option value="ALL">All Audience Scopes</option>
                <option value="ICP">ICP (Home Service Contractors)</option>
                <option value="PEER">PEER (Systems & AI Engineers)</option>
                <option value="BRIDGE">BRIDGE (Cross-Disciplinary)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPresetModal(true)}
                className="flex items-center gap-1.5 bg-[#161D26] hover:bg-[#1E293B] border border-[#00C9A7]/40 text-[#00C9A7] text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Starter Pack
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Brand Directive
              </button>
            </div>
          </div>

          {/* Starter Pack Modal */}
          {showPresetModal && (
            <div className="bg-[#0F1419] p-6 rounded-2xl border border-[#00C9A7]/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00C9A7]" />
                    Import Brand Starter Pack
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Instantly load curated editorial philosophies, core themes, and audience lanes into your workspace.
                  </p>
                </div>
                <button
                  onClick={() => setShowPresetModal(false)}
                  className="text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {BRAND_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl border border-[#1F2D3D] bg-[#070B0F] hover:border-[#00C9A7]/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#00C9A7] border border-[#00C9A7]/30">
                          {preset.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#F1F5F9] mb-1">{preset.name}</h4>
                      <p className="text-[11px] text-[#94A3B8] line-clamp-3 mb-4 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={applyingPreset}
                      onClick={() => handleApplyPreset(preset.id)}
                      className="w-full py-2 bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 border border-[#00C9A7]/40 text-[#00C9A7] text-xs font-semibold rounded-lg transition-all text-center disabled:opacity-50"
                    >
                      {applyingPreset ? "Importing..." : "Load into Workspace"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Directive Modal */}
          {showAddModal && (
            <div className="bg-[#0F1419] p-6 rounded-2xl border border-[#00C9A7]/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3">
                <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00C9A7]" />
                  New Brand Directive
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleAddDirective} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Category</label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value as BrandCategory)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Key / Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. core_philosophy (optional)"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(Number(e.target.value) as 1 | 2 | 3)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    >
                      <option value={1}>1 (Always Loaded into Prompts)</option>
                      <option value={2}>2 (Loaded for Matching Category)</option>
                      <option value={3}>3 (Contextual / Edge Case)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Audience Scope</label>
                    <select
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value as AudienceScope)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    >
                      <option value="ALL">ALL (Every Audience)</option>
                      <option value="ICP">ICP (Contractors & Operators)</option>
                      <option value="PEER">PEER (Systems & AI Engineers)</option>
                      <option value="BRIDGE">BRIDGE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Content (Instruction or Example)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the concrete brand instruction, rule, or example..."
                    value={newContent}
                    onChange={(e) => {
                      setNewContent(e.target.value);
                      if (!newKey) {
                        const autoSlug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9\s]/g, "")
                          .trim()
                          .split(/\s+/)
                          .slice(0, 3)
                          .join("_");
                        if (autoSlug) setNewKey(autoSlug);
                      }
                    }}
                    required
                    className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl p-3 text-xs text-[#F1F5F9] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:bg-[#161D26]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] font-bold rounded-xl text-xs shadow-sm"
                  >
                    Save Directive
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directives Cards */}
          <div className="grid grid-cols-1 gap-3">
            {directivesLoading && <LoadingState label="Loading brand directives…" />}
            {!directivesLoading && filteredDirectives.length === 0 && (
              <EmptyState
                title="No directives match these filters"
                description="Adjust the category, priority, or audience filters, or add a new directive."
              />
            )}
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
                        ? "bg-red-500/5 border-red-500/30" 
                        : isProof
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : isVoice
                            ? "bg-cyan-500/5 border-cyan-500/30"
                            : "bg-[#0F1419] border-[#1F2D3D] hover:border-[#00C9A7]/40"
                      : "bg-[#0F1419]/40 border-[#1F2D3D]/30 opacity-50"
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
                              : "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30"
                      }`}>
                        {directive.category}
                      </span>

                      <span className="text-xs font-mono font-semibold text-[#F1F5F9]">
                        {directive.key}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                        Priority {directive.priority}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                        Scope: {directive.audience_scope}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => toggleDirective(directive.id)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded transition-all ${
                          directive.is_active
                            ? "text-[#00C9A7] hover:bg-[#00C9A7]/10"
                            : "text-[#64748B] hover:bg-[#161D26]"
                        }`}
                      >
                        {directive.is_active ? "● Active" : "○ Disabled"}
                      </button>

                      <button
                        onClick={() => copyToClipboard(directive.content, directive.id)}
                        className="text-[#94A3B8] hover:text-[#F1F5F9] p-1"
                        title="Copy content"
                      >
                        {copiedKey === directive.id ? (
                          <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => deleteDirective(directive.id)}
                        className="text-[#94A3B8] hover:text-red-400 p-1"
                        title="Delete directive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed font-sans mt-2 bg-[#070B0F]/60 p-3 rounded-lg border border-[#1F2D3D]">
                    {directive.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: BANNED LEXICON & COMPLIANCE */}
      {/* ======================================================== */}
      {activeTab === "lexicon" && (
        <LexiconTab
          bannedWords={forbiddenDirectives}
          isLoading={directivesLoading}
          newBannedWord={newBannedWord}
          setNewBannedWord={setNewBannedWord}
          onAddBannedWord={handleAddBannedWord}
          onRemoveBannedWord={removeBannedWord}
        />
      )}
    </div>
  );
}
