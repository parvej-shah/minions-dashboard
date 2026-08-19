"use client";

import React from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  ExternalLink,
  Filter,
} from "lucide-react";
import { SOCIAL_TEMPLATES } from "@/constants/brandAssets";

export interface SocialTemplatesTabProps {
  socialPlatformFilter: string;
  setSocialPlatformFilter: (v: string) => void;
  socialTypeFilter: "ALL" | "COVER" | "AVATAR";
  setSocialTypeFilter: (v: "ALL" | "COVER" | "AVATAR") => void;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

/** Downloadable social cover and avatar templates. */
export default function SocialTemplatesTab({
  socialPlatformFilter,
  setSocialPlatformFilter,
  socialTypeFilter,
  setSocialTypeFilter,
  copiedKey,
  copyToClipboard,
}: SocialTemplatesTabProps) {
  const filteredSocialTemplates = SOCIAL_TEMPLATES.filter((tmpl) => {
    if (socialPlatformFilter !== "ALL" && tmpl.platform !== socialPlatformFilter) return false;
    if (socialTypeFilter !== "ALL" && tmpl.type !== socialTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F1419] p-4 rounded-2xl border border-[#1F2D3D]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#00C9A7]" />
            <span className="text-xs font-mono text-[#94A3B8]">Platform:</span>
            <select
              value={socialPlatformFilter}
              onChange={(e) => setSocialPlatformFilter(e.target.value)}
              className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            >
              <option value="ALL">All Social Networks ({SOCIAL_TEMPLATES.length})</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TWITTER">Twitter / X</option>
              <option value="GITHUB">GitHub</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="SQUAD">Mascot Squad Banners</option>
            </select>
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-[#94A3B8]">Type:</span>
            <select
              value={socialTypeFilter}
              onChange={(e) => setSocialTypeFilter(e.target.value as "ALL" | "COVER" | "AVATAR")}
              className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            >
              <option value="ALL">All Asset Formats</option>
              <option value="COVER">Social Covers & Headers</option>
              <option value="AVATAR">Profile Avatars (800×800)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-[#00C9A7]">
          Showing {filteredSocialTemplates.length} real assets
        </div>
      </div>

      {/* Social Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSocialTemplates.map((template) => {
          const isCover = template.type === "COVER";

          return (
            <div
              key={template.id}
              className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/50 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
            >
              <div className="space-y-3">
                {/* Image Preview Container */}
                <div 
                  className={`relative rounded-xl overflow-hidden bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center ${
                    isCover ? "aspect-[16/7]" : "aspect-square max-h-56 mx-auto w-full"
                  }`}
                >
                  <Image
                    src={template.path}
                    alt={template.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Platform Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#1F2D3D] text-[10px] font-mono text-[#00C9A7] font-bold">
                    {template.platform}
                  </div>

                  {/* Resolution Badge */}
                  <div className="absolute bottom-2.5 right-2.5 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#1F2D3D] text-[10px] font-mono text-[#94A3B8]">
                    {template.dimensions}
                  </div>
                </div>

                {/* Meta info */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors line-clamp-1">
                      {template.name}
                    </h4>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      template.theme === "DARK" 
                        ? "bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]" 
                        : template.theme === "TEAL"
                        ? "bg-[#0E5C63]/30 text-[#00C9A7] border border-[#0E5C63]"
                        : template.theme === "LIGHT"
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {template.theme}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t border-[#1F2D3D] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#64748B] truncate max-w-[160px]">
                  {template.path}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(template.path, template.id)}
                    className="p-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-[#94A3B8] hover:text-[#00C9A7] transition-all"
                    title="Copy Asset Path"
                  >
                    {copiedKey === template.id ? (
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={template.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-[#94A3B8] hover:text-white transition-all"
                    title="Open Full Asset"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
