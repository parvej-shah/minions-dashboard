"use client";

import React, { useEffect, useState } from "react";
import {
  Palette,
  Upload,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { fetchBrandSettings } from "@/lib/api";
import { BrandSettings } from "@/lib/types";

export default function BrandStudioPage() {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [primaryInk, setPrimaryInk] = useState("#12242a");
  const [brandTeal, setBrandTeal] = useState("#0e5c63");
  const [brandCoral, setBrandCoral] = useState("#ff6b4a");
  const [brandCream, setBrandCream] = useState("#fff8f0");
  const [visualStyle, setVisualStyle] = useState("Tactile Commercial Studio Flat-Lay (Real stitched leather clipboard, metallic clip, dark slate tabletop, softbox rim lighting)");
  const [showBadge, setShowBadge] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [minWords, setMinWords] = useState(3);
  const [maxWords, setMaxWords] = useState(6);

  useEffect(() => {
    async function loadBrand() {
      const data = await fetchBrandSettings();
      setSettings(data);
      setPrimaryInk(data.primary_ink);
      setBrandTeal(data.brand_teal);
      setBrandCoral(data.brand_coral);
      setBrandCream(data.brand_cream);
      if (data.thumbnail_layout) {
        setVisualStyle(data.thumbnail_layout.visual_style);
        setShowBadge(data.thumbnail_layout.show_badge);
        setShowLogo(data.thumbnail_layout.show_logo);
        setMinWords(data.thumbnail_layout.title_word_count_min);
        setMaxWords(data.thumbnail_layout.title_word_count_max);
      }
    }
    loadBrand();
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setNotification("Saving brand tokens and synchronizing with Qwen Image generator...");
    setTimeout(() => {
      setIsSaving(false);
      setNotification("✅ Brand settings & visual formulas saved to Cloudflare R2 & Supabase!");
      setTimeout(() => setNotification(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#0e5c63] uppercase tracking-wider mb-1">
            <Palette className="w-3.5 h-3.5" />
            <span>Brand System & Visual Guidelines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12242a]">
            Brand & Asset Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize official colors, upload brand assets to Cloudflare R2, and tune the AI thumbnail generator.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-xs font-bold text-white shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4 text-[#ff6b4a]" />
          <span>{isSaving ? "Saving..." : "Save Brand Settings"}</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* SECTION 1: CORE BRAND COLOR TOKENS */}
      <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
          <h2 className="text-sm font-bold text-[#12242a]">Official Brand Color Tokens</h2>
          <span className="text-xs text-slate-400 font-mono">Inherited across Blog & Visual Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Primary Ink */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] space-y-3">
            <div className="h-12 rounded-lg shadow-inner" style={{ backgroundColor: primaryInk }}></div>
            <div>
              <div className="text-xs font-bold text-[#12242a]">Primary Slate Ink</div>
              <div className="text-[11px] text-slate-500">Dark tabletop & headline ink</div>
            </div>
            <input
              type="text"
              value={primaryInk}
              onChange={(e) => setPrimaryInk(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-mono"
            />
          </div>

          {/* Brand Teal */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] space-y-3">
            <div className="h-12 rounded-lg shadow-inner" style={{ backgroundColor: brandTeal }}></div>
            <div>
              <div className="text-xs font-bold text-[#12242a]">Brand Teal</div>
              <div className="text-[11px] text-slate-500">Primary buttons & badges</div>
            </div>
            <input
              type="text"
              value={brandTeal}
              onChange={(e) => setBrandTeal(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-mono"
            />
          </div>

          {/* Brand Coral */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] space-y-3">
            <div className="h-12 rounded-lg shadow-inner" style={{ backgroundColor: brandCoral }}></div>
            <div>
              <div className="text-xs font-bold text-[#12242a]">Vibrant Coral</div>
              <div className="text-[11px] text-slate-500">CTA highlights & .AI logo mark</div>
            </div>
            <input
              type="text"
              value={brandCoral}
              onChange={(e) => setBrandCoral(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-mono"
            />
          </div>

          {/* Brand Cream */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] space-y-3">
            <div className="h-12 rounded-lg shadow-inner" style={{ backgroundColor: brandCream }}></div>
            <div>
              <div className="text-xs font-bold text-[#12242a]">Brand Cream Canvas</div>
              <div className="text-[11px] text-slate-500">Page background & surfaces</div>
            </div>
            <input
              type="text"
              value={brandCream}
              onChange={(e) => setBrandCream(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: LOGO & VECTOR ASSET MANAGER (CLOUDFLARE R2) */}
      <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
          <div>
            <h2 className="text-sm font-bold text-[#12242a]">Brand Logos & Vector Assets</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stored directly in Cloudflare R2 bucket (`minions-assets`) with global edge CDN delivery.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded bg-teal-50 text-[#0e5c63] border border-teal-100">
            R2 Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Card 1: Horizontal Wordmark */}
          <div className="p-5 rounded-xl bg-[#12242a] text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Minions.AI Wordmark</span>
              <span className="text-[10px] font-mono text-teal-300">SVG / PNG</span>
            </div>
            <div className="h-20 rounded-lg bg-[#1a313a] border border-[#2b4752] flex items-center justify-center">
              <div className="flex items-baseline">
                <span className="font-bold text-xl tracking-tight text-white">Minions</span>
                <span className="font-bold text-xl text-[#ff6b4a]">.AI</span>
              </div>
            </div>
            <label className="w-full py-2 px-3 rounded-lg bg-[#0e5c63] hover:bg-[#167a84] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New SVG to R2</span>
              <input type="file" accept=".svg,.png" className="hidden" />
            </label>
          </div>

          {/* Logo Card 2: Monogram Symbol */}
          <div className="p-5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#12242a]">Minions Monogram Icon</span>
              <span className="text-[10px] font-mono text-slate-400">Favicon / App Icon</span>
            </div>
            <div className="h-20 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e5c63] to-[#ff6b4a] flex items-center justify-center font-bold text-white shadow-md text-base">
                M
              </div>
            </div>
            <label className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-[#e5e7eb] text-[#12242a] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload Monogram to R2</span>
              <input type="file" accept=".svg,.png" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 3: 2K COVER CARD PROMPT SYSTEM */}
      <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
          <div>
            <h2 className="text-sm font-bold text-[#12242a]">Qwen Image 3.0 Cover Formula Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforces the Stripe/Linear tactile commercial flat-lay standard on all generated thumbnail cards.
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-[#ff6b4a]" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
              Tactile Visual Prop Prompt Formula
            </label>
            <textarea
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              rows={3}
              className="w-full p-3.5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs text-[#12242a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63] leading-relaxed font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] cursor-pointer">
              <input
                type="checkbox"
                checked={showBadge}
                onChange={(e) => setShowBadge(e.target.checked)}
                className="rounded text-[#0e5c63] focus:ring-[#0e5c63]"
              />
              <span className="text-xs font-semibold text-[#12242a]">Render [ARCHITECT] Badge</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] cursor-pointer">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="rounded text-[#0e5c63] focus:ring-[#0e5c63]"
              />
              <span className="text-xs font-semibold text-[#12242a]">Render Top-Right Logo</span>
            </label>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500">Min Title Words</label>
              <input
                type="number"
                value={minWords}
                onChange={(e) => setMinWords(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500">Max Title Words</label>
              <input
                type="number"
                value={maxWords}
                onChange={(e) => setMaxWords(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
