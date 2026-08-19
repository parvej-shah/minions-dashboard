"use client";

import React from "react";
import Image from "next/image";
import { Bot, Check, Copy, ExternalLink } from "lucide-react";
import { MASCOT_SQUAD } from "@/constants/brandAssets";

export interface MascotsTabProps {
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

/** The mascot squad gallery. */
export default function MascotsTab({
  copiedKey,
  copyToClipboard,
}: MascotsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#00C9A7]" />
            <h2 className="text-base font-bold text-[#F1F5F9]">
              The Minions Mascot Squad (5 Active Field AI Minions)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2.5 py-1 rounded-full border border-[#00C9A7]/30 font-semibold">
            ● 5 Autonomous Workers Provisioned
          </span>
        </div>
        <p className="text-xs text-[#94A3B8] max-w-3xl">
          Each Minion represents an active autonomous subsystem inside getminions.ai, from sub-1.8s voice intake (Rex) to deterministic schema validation (Otto) and rapid speed-to-lead nurturing (Pip).
        </p>
      </div>

      {/* 5 Mascot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MASCOT_SQUAD.map((mascot) => (
          <div
            key={mascot.id}
            className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/60 transition-all flex flex-col justify-between space-y-4 shadow-sm group relative overflow-hidden"
          >
            <div className="space-y-3">
              {/* Top Avatar Preview Frame */}
              <div className="relative aspect-square rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center p-4 overflow-hidden group-hover:border-[#00C9A7]/40 transition-colors">
                <Image
                  src={mascot.avatar_path}
                  alt={mascot.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 220px"
                  className="object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
                />

                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#00C9A7]/30">
                  <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#00C9A7] font-semibold">Active Minion</span>
                </div>

                {/* Codename Badge */}
                <div className="absolute bottom-3 left-3 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#1F2D3D] text-[10px] font-mono text-[#94A3B8]">
                  {mascot.codename}
                </div>

                {/* Open High-Res Button */}
                <a
                  href={mascot.avatar_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 p-1.5 rounded-lg bg-[#161D26]/90 backdrop-blur-md text-[#94A3B8] hover:text-white border border-[#1F2D3D] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Open full avatar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Info Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors">
                    {mascot.name}
                  </h3>
                  <span className="text-[11px] font-mono text-[#ff6b4a] font-semibold bg-[#ff6b4a]/10 px-2 py-0.5 rounded border border-[#ff6b4a]/20">
                    {mascot.trade}
                  </span>
                </div>
                <div className="text-xs font-medium text-[#3B82F6] mt-0.5 font-mono">
                  {mascot.role}
                </div>
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {mascot.description}
              </p>

              {/* Skills tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mascot.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-mono bg-[#161D26] text-[#94A3B8] px-2 py-0.5 rounded border border-[#1F2D3D]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-3 border-t border-[#1F2D3D] flex items-center justify-between">
              <div className="text-[10px] font-mono text-[#64748B] truncate max-w-[170px]">
                {mascot.avatar_path}
              </div>

              <button
                onClick={() => copyToClipboard(mascot.avatar_path, mascot.id)}
                className="flex items-center gap-1 text-xs font-bold text-[#00C9A7] hover:text-[#00A88A] bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 px-2.5 py-1 rounded-lg border border-[#00C9A7]/30 transition-all"
              >
                {copiedKey === mascot.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Asset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
