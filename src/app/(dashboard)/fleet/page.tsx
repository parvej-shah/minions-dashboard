"use client";

import React from "react";
import Link from "next/link";
import {
  Share2,
  Sparkles,
  FileText,
  Globe,
  Radio,
} from "lucide-react";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

export const dynamic = "force-dynamic";

export default function FleetPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HEADER & BROADCAST HEALTH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <Radio className="w-3.5 h-3.5 text-[#00C9A7] animate-pulse" />
            <span>Omnichannel Engine</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Broadcast & Distribution
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Configure, authenticate, and manage your live distribution channels for multi-platform broadcasting across LinkedIn, Facebook, X, and the Minions Blog.
          </p>
        </div>

        {/* Live Channel Status Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#0F1419] px-4 py-2.5 rounded-xl border border-[#1F2D3D] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C9A7] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#F1F5F9]">
              Omnichannel Ready
            </span>
          </div>
          <span className="text-[#1F2D3D]">|</span>
          <span className="text-xs font-mono text-[#94A3B8]">
            Multi-Platform Sync
          </span>
        </div>
      </div>

      {/* OMNICHANNEL DISTRIBUTION CHANNELS & BROADCAST CONTROLS (PRIMARY) */}
      <DistributionControlPanel />

      {/* QUICK WORKFLOW SHORTCUTS */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F1419] to-[#161D26] border border-[#1F2D3D] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center md:text-left">
          <h3 className="text-sm font-bold text-[#F1F5F9]">Ready to review and publish?</h3>
          <p className="text-xs text-[#94A3B8]">
            Approve drafts in Editorial Studio to broadcast live to your enabled channels.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/editorial"
            className="px-3.5 py-2 rounded-xl bg-[#00C9A7] hover:bg-[#00B594] text-[#070B0F] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#00C9A7]/10"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Editorial Studio →</span>
          </Link>
          <Link
            href="/ideas"
            className="px-3.5 py-2 rounded-xl bg-[#0F1419] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] font-medium text-xs flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00C9A7]" />
            <span>Idea Stream</span>
          </Link>
          <Link
            href="/published"
            className="px-3.5 py-2 rounded-xl bg-[#0F1419] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] font-medium text-xs flex items-center gap-2 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Published Posts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
