"use client";

import React from "react";
import Image from "next/image";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Palette,
  Sparkles,
} from "lucide-react";
import type { BrandTab } from "@/types";

export interface VisualsTabProps {
  logoBgMode: "dark" | "white" | "teal" | "checker";
  setLogoBgMode: (m: "dark" | "white" | "teal" | "checker") => void;
  activeLogoVariant: "inverted" | "primary" | "teal";
  setActiveLogoVariant: (v: "inverted" | "primary" | "teal") => void;
  currentLogoSrc: string;
  setActiveTab: (t: BrandTab) => void;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

/** Logo studio, colour palette, and favicon previews. */
export default function VisualsTab({
  logoBgMode,
  setLogoBgMode,
  activeLogoVariant,
  setActiveLogoVariant,
  currentLogoSrc,
  setActiveTab,
  copiedKey,
  copyToClipboard,
}: VisualsTabProps) {
  return (
    <div className="space-y-6">
      {/* Main Logo & Vector Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Logo Canvas (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#00C9A7]" />
                <h2 className="text-sm font-bold text-[#F1F5F9]">
                  Official Brand Transparent Logo Wordmarks
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded-full border border-[#00C9A7]/30 font-semibold">
                Real PNG Alpha Assets
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Real transparent brand logos rendered by the Visual Art Director for cover synthesis, social cards, and PDF technical teardowns.
            </p>

            {/* Variant Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveLogoVariant("inverted");
                  setLogoBgMode("dark");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeLogoVariant === "inverted"
                    ? "bg-[#161D26] text-[#00C9A7] border border-[#00C9A7] shadow-sm"
                    : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9]"
                }`}
              >
                <span>Inverted (White + Coral)</span>
                <span className="text-[10px] opacity-75">Dark Surfaces</span>
              </button>

              <button
                onClick={() => {
                  setActiveLogoVariant("primary");
                  setLogoBgMode("white");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeLogoVariant === "primary"
                    ? "bg-[#161D26] text-[#00C9A7] border border-[#00C9A7] shadow-sm"
                    : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9]"
                }`}
              >
                <span>Primary (Dark + Coral)</span>
                <span className="text-[10px] opacity-75">Light Canvas</span>
              </button>

              <button
                onClick={() => {
                  setActiveLogoVariant("teal");
                  setLogoBgMode("dark");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  activeLogoVariant === "teal"
                    ? "bg-[#161D26] text-[#00C9A7] border border-[#00C9A7] shadow-sm"
                    : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9]"
                }`}
              >
                <span>Teal Wordmark</span>
                <span className="text-[10px] opacity-75">Accent Cards</span>
              </button>
            </div>

            {/* Live Logo Preview Canvas with Interactive Backgrounds */}
            <div 
              className={`p-10 rounded-2xl border border-[#1F2D3D] flex items-center justify-center min-h-[180px] shadow-inner relative transition-all group ${
                logoBgMode === "dark" 
                  ? "bg-[#070B0F]" 
                  : logoBgMode === "white" 
                  ? "bg-white" 
                  : logoBgMode === "teal"
                  ? "bg-[#0E5C63]"
                  : "bg-[#121820] bg-[radial-gradient(#263445_1px,transparent_1px)] [background-size:12px_12px]"
              }`}
            >
              <Image
                src={currentLogoSrc}
                alt="Minions.AI Brand Logo"
                width={320}
                height={64}
                className="max-h-16 max-w-[320px] object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />

              {/* Actions overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(currentLogoSrc, "logo-path")}
                  className="p-2 rounded-xl bg-[#0F1419]/90 backdrop-blur-md text-[#94A3B8] hover:text-[#00C9A7] border border-[#1F2D3D] shadow-lg transition-all"
                  title="Copy asset path"
                >
                  {copiedKey === "logo-path" ? (
                    <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={currentLogoSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#0F1419]/90 backdrop-blur-md text-[#94A3B8] hover:text-white border border-[#1F2D3D] shadow-lg transition-all"
                  title="Open full-resolution asset"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Canvas Background Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#64748B]">Preview Background:</span>
                <button
                  onClick={() => setLogoBgMode("dark")}
                  className={`w-6 h-6 rounded-lg bg-[#070B0F] border ${logoBgMode === "dark" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                  title="Dark Slate #070B0F"
                />
                <button
                  onClick={() => setLogoBgMode("white")}
                  className={`w-6 h-6 rounded-lg bg-white border ${logoBgMode === "white" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                  title="Clean White #FFFFFF"
                />
                <button
                  onClick={() => setLogoBgMode("teal")}
                  className={`w-6 h-6 rounded-lg bg-[#0E5C63] border ${logoBgMode === "teal" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                  title="Brand Teal #0E5C63"
                />
                <button
                  onClick={() => setLogoBgMode("checker")}
                  className={`w-6 h-6 rounded-lg bg-[#121820] border ${logoBgMode === "checker" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                  title="Transparency Grid"
                />
              </div>

              <div className="text-[11px] font-mono text-[#00C9A7] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
                <span>{currentLogoSrc}</span>
              </div>
            </div>
          </div>

          {/* Logo Path & Copy Bar */}
          <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-between text-xs mt-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono uppercase bg-[#00C9A7]/10 text-[#00C9A7] px-2 py-0.5 rounded border border-[#00C9A7]/20 font-bold">
                Active Asset
              </span>
              <code className="text-[#F1F5F9] font-mono text-[11px] truncate">
                {currentLogoSrc}
              </code>
            </div>

            <button
              onClick={() => copyToClipboard(currentLogoSrc, "bar-path")}
              className="flex items-center gap-1 text-[11px] font-mono text-[#94A3B8] hover:text-[#00C9A7] shrink-0 font-semibold"
            >
              {copiedKey === "bar-path" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Path</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Favicon & Vector Tokens (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                App Favicon & Multi-Scale Assets
              </h3>
              <span className="text-[10px] font-mono text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full border border-[#3B82F6]/30 font-semibold">
                Vector SVG Active
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Multi-resolution browser tab icon and PWA touch asset served at <code className="text-[#3B82F6] font-mono">/icon.svg</code> with vector scaling.
            </p>

            {/* Multi-Size Favicon Previews */}
            <div className="p-6 rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-around shadow-inner">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md group hover:border-[#00C9A7] transition-all">
                  <Image src="/icon.svg" alt="64x64" width={64} height={64} className="w-12 h-12 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8]">64×64 (Hi-DPI)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md group hover:border-[#00C9A7] transition-all">
                  <Image src="/icon.svg" alt="32x32" width={32} height={32} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8]">32×32 (Desktop)</div>
              </div>

              <div className="text-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md group hover:border-[#00C9A7] transition-all">
                  <Image src="/icon.svg" alt="16x16" width={16} height={16} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8]">16×16 (Tab)</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs text-[#94A3B8] flex items-center justify-between">
              <span>Source File: <code className="text-[#F1F5F9] font-mono">public/icon.svg</code></span>
              <span className="text-[#00C9A7] font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synchronized
              </span>
            </div>
          </div>

          {/* Quick Mascot Teaser Banner */}
          <div 
            onClick={() => setActiveTab("mascots")}
            className="p-4 rounded-xl bg-gradient-to-r from-[#0E5C63]/30 via-[#161D26] to-[#0F1419] border border-[#00C9A7]/30 hover:border-[#00C9A7] transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-[#00C9A7]/40 shrink-0">
                <Image src="/images/mascots/rex.png" alt="Rex" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors">
                  Mascot Squad Available (5 Minions)
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Rex, Gia, Otto, Pip & Zip active
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-[#00C9A7] font-bold">Inspect →</span>
          </div>
        </div>
      </div>

      {/* Color tokens moved to the editable Brand Profile tab */}
      <button
        onClick={() => setActiveTab("profile")}
        className="w-full p-4 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/40 flex items-center justify-between text-left transition-all group"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#00C9A7]" />
          <span className="text-sm font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors">
            Color palette tokens are now editable in the Brand Profile tab
          </span>
        </div>
        <span className="text-xs font-mono text-[#00C9A7] font-bold">Edit Colors →</span>
      </button>
    </div>
  );
}
