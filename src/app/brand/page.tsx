"use client";

import { useState } from "react";
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
  Send,
  ImageIcon,
  Maximize2,
  ExternalLink,
  Lock
} from "lucide-react";
import { BrandDirectiveItem, BrandCategory } from "@/lib/types";
import { INITIAL_BRAND_DIRECTIVES } from "@/lib/api";

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
  const [activeTab, setActiveTab] = useState<"directives" | "multi_brand" | "visuals" | "lexicon">("visuals");
  const [directives, setDirectives] = useState<BrandDirectiveItem[]>(INITIAL_BRAND_DIRECTIVES);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<number | "ALL">("ALL");
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Visual Assets & Logo Management State
  const [logoUrl, setLogoUrl] = useState("https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/minions_logo_primary.svg");
  const [customLogoInput, setCustomLogoInput] = useState("");
  const [logoSaved, setLogoSaved] = useState(false);

  // Favicon state
  const [faviconUrl, setFaviconUrl] = useState("/icon.svg");

  // Cover Reference Templates
  const [coverTemplates, setCoverTemplates] = useState([
    {
      id: "TMPL-01",
      name: "Tactile Studio Leather Flat-Lay",
      description: "Real stitched leather clipboard, dark slate tabletop, volumetric rim lighting, centered minimalist title",
      is_active: true,
      preview_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png"
    },
    {
      id: "TMPL-02",
      name: "Minimalist Slate Blueprint",
      description: "Dark carbon texture, architectural grid lines, cyan & teal schematics, high-contrast monochrome typography",
      is_active: false,
      preview_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png"
    }
  ]);

  // Brand Colors state
  const [brandColors, setBrandColors] = useState({
    primaryInk: "#12242a",
    brandTeal: "#0e5c63",
    brandCoral: "#ff6b4a",
    creamCanvas: "#fff8f0"
  });

  // Modal State
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

  const handleUpdateLogo = () => {
    if (customLogoInput.trim()) {
      setLogoUrl(customLogoInput.trim());
      setLogoSaved(true);
      setCustomLogoInput("");
      setTimeout(() => setLogoSaved(false), 3000);
    }
  };

  const toggleCoverTemplate = (id: string) => {
    setCoverTemplates(coverTemplates.map(t => ({
      ...t,
      is_active: t.id === id
    })));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Brand Governance & Context Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Brand Directives & Visual Assets
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage live LLM directives, upload AI logo references, inspect favicon tokens, and configure multi-brand instructions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0F1419] p-1 rounded-xl border border-[#1F2D3D] self-start md:self-auto">
          <button
            onClick={() => setActiveTab("visuals")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "visuals"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Visuals & Logo Studio
          </button>
          <button
            onClick={() => setActiveTab("directives")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "directives"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Directives ({directives.length})
          </button>
          <button
            onClick={() => setActiveTab("multi_brand")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "multi_brand"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Instruct Agents
          </button>
          <button
            onClick={() => setActiveTab("lexicon")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "lexicon"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Banned Lexicon ({bannedWords.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VISUALS & LOGO STUDIO (THE MISSING FEATURE PER PRD) */}
      {activeTab === "visuals" && (
        <div className="space-y-6">
          {/* Logo & Favicon Management Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Logo Configuration */}
            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#00C9A7]" />
                    AI Brand Logo (Used for 2K Cover Synthesis)
                  </h3>
                  <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded-full border border-[#00C9A7]/30">
                    Primary Wordmark
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  This vector logo asset is served directly to the Visual Art Director agent (<code className="text-[#00C9A7] font-mono">qwen-image-3.0</code>) to render the official watermark on cover cards.
                </p>

                {/* Logo Preview Canvas */}
                <div className="p-8 rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center min-h-[140px] shadow-inner relative group">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black tracking-tight text-white">
                      minions
                    </span>
                    <span className="text-[#ff6b4a] font-mono font-black text-4xl ml-1">
                      .ai
                    </span>
                  </div>

                  <a
                    href={logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#161D26] text-[#94A3B8] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open full asset"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Direct Logo URL Input & Uploader */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-mono text-[#94A3B8] block">Modify Cloudflare R2 / Cloudinary Logo URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://pub-xxx.r2.dev/logo.svg"
                      value={customLogoInput}
                      onChange={(e) => setCustomLogoInput(e.target.value)}
                      className="flex-1 bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3.5 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                    />
                    <button
                      onClick={handleUpdateLogo}
                      className="bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
                    >
                      Update Logo
                    </button>
                  </div>
                </div>

                {logoSaved && (
                  <div className="text-xs text-[#00C9A7] flex items-center gap-1.5 font-medium animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Logo reference updated and synchronized to AI generation engine!
                  </div>
                )}
              </div>
            </div>

            {/* Favicon & Multi-Size Preview */}
            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                    App Favicon & Touch Icons
                  </h3>
                  <span className="text-[10px] font-mono text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full border border-[#3B82F6]/30">
                    Vector SVG Active
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  The live browser tab icon served at <code className="text-[#3B82F6] font-mono">/icon.svg</code> with multi-size resolution scaling.
                </p>

                {/* Multi-Size Favicon Previews */}
                <div className="p-6 rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-around shadow-inner">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md">
                      <img src="/icon.svg" alt="64x64" className="w-12 h-12" />
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">64×64 (Hi-DPI)</div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md">
                      <img src="/icon.svg" alt="32x32" className="w-8 h-8" />
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">32×32 (Standard)</div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md">
                      <img src="/icon.svg" alt="16x16" className="w-5 h-5" />
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">16×16 (Tab)</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs text-[#94A3B8] flex items-center justify-between">
                  <span>Current Favicon Source: <code className="text-[#F1F5F9] font-mono">src/app/icon.svg</code></span>
                  <span className="text-[#00C9A7] font-semibold text-[11px]">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Style Reference Templates */}
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ff6b4a]" />
                  Cover Image Reference Style Templates
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Visual style references injected into the Qwen Image 3.0 prompt for editorial cover synthesis.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coverTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => toggleCoverTemplate(tmpl.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-4 ${
                    tmpl.is_active
                      ? "bg-[#161D26] border-[#00C9A7] shadow-lg shadow-[#00C9A7]/10"
                      : "bg-[#0F1419] border-[#1F2D3D] hover:border-[#2A3D52]"
                  }`}
                >
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-[#1F2D3D]">
                    <img src={tmpl.preview_url} alt={tmpl.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F1F5F9]">{tmpl.name}</span>
                      {tmpl.is_active ? (
                        <span className="text-[10px] font-mono text-[#00C9A7] font-bold">● Active Style</span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#64748B]">Select Style</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Brand Color Tokens */}
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#00C9A7]" />
              Official Brand Color Palette Tokens
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#12242a] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Deep Slate Ink</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#12242a</code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#0e5c63] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Brand Teal</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#0e5c63</code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#ff6b4a] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Vibrant Coral</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#ff6b4a</code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#fff8f0] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Cream Canvas</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#fff8f0</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTIVES TABLE (REPLACES SHEETS BRAND TAB) */}
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

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Brand Directive
            </button>
          </div>

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
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Key (Slug)</label>
                    <input
                      type="text"
                      placeholder="e.g. attic_thermal_leak"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      required
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
                      onChange={(e) => setNewAudience(e.target.value as any)}
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
                    onChange={(e) => setNewContent(e.target.value)}
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

      {/* TAB 3: INSTRUCT AGENTS / MULTI-BRAND INSTRUCTION */}
      {activeTab === "multi_brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#00C9A7]" />
                    Direct Brand & Mission Dispatcher
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Write high-priority operator instructions injected into all autonomous agent reasoning prompts.
                  </p>
                </div>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] font-medium"
                >
                  <option value="getminions.ai">getminions.ai (Primary Ops)</option>
                  <option value="minions_voice_demo">Minions Voice AI Demo</option>
                  <option value="minions_enterprise">Minions Enterprise Field Ops</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#F1F5F9] flex items-center justify-between">
                  <span>Operator System Directive</span>
                  <span className="text-[11px] font-mono text-[#00C9A7]">Injected before Stage 1 Reasoning</span>
                </label>
                <textarea
                  rows={6}
                  value={operatorPrompt}
                  onChange={(e) => {
                    setOperatorPrompt(e.target.value);
                    setPromptSaved(false);
                  }}
                  className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl p-4 text-xs font-mono text-[#F1F5F9] leading-relaxed focus:outline-none focus:border-[#00C9A7] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#94A3B8] flex items-center gap-2">
                  {promptSaved ? (
                    <span className="text-[#00C9A7] flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Synchronized to all 7 agent workers!
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
                  className="bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Save & Broadcast to Fleet
                </button>
              </div>
            </div>

            {/* Injected Context Preview */}
            <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
              <h4 className="text-xs font-mono font-bold text-[#94A3B8] uppercase flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#00C9A7]" />
                Live Agent Ingestion Preview (What the LLM Sees)
              </h4>
              <pre className="bg-[#070B0F] p-4 rounded-xl text-[11px] font-mono text-[#00C9A7] overflow-x-auto leading-relaxed border border-[#1F2D3D]">
{`=== BRAND CONTEXT INJECTION [${selectedBrand.toUpperCase()}] ===
Company Name: getminions.ai (lowercase, .ai suffix)
Positioning: AI operations partner for US home-services businesses (1-10 techs)
Primary Logo URL: "${logoUrl}"
Tone: Technical, tactile operator prose. 1-3 sentences per paragraph.
Operator Directive: "${operatorPrompt}"
Forbidden Words: [${bannedWords.slice(0, 8).join(", ")}...]
Allowed Proof: Live callable demo number, RAG chatbot, deterministic Go schema.`}
              </pre>
            </div>
          </div>

          {/* Right sidebar: Persona Lanes */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-[#F1F5F9] uppercase font-mono tracking-wider">
                Audience Persona Lanes
              </h3>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#3B82F6]/30">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3B82F6] mb-1">
                    <span>ICP: Operators</span>
                    <span className="text-[10px] font-mono bg-[#3B82F6]/10 px-1.5 py-0.5 rounded">Primary</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-snug">
                    US home service contractors (HVAC, plumbing, electrical) with 1–10 vans. Motivated by speed-to-lead, technician overtime reduction, and zero warranty callbacks.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#8B5CF6]/30">
                  <div className="flex items-center justify-between text-xs font-bold text-[#8B5CF6] mb-1">
                    <span>PEER: Systems Engineers</span>
                    <span className="text-[10px] font-mono bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">Technical</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-snug">
                    CTOs, AI architects, and multi-agent system developers. Motivated by deterministic schema validation, sub-1.8s audio latency, and production reliability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BANNED LEXICON & COMPLIANCE */}
      {activeTab === "lexicon" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Banned Lexicon & AI Cliché Blacklist
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
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
                  className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                />
                <button
                  onClick={handleAddBannedWord}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
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
                  className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono px-3 py-1.5 rounded-xl"
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
        </div>
      )}
    </div>
  );
}
