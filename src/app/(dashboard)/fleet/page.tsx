"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, FileText, Globe } from "lucide-react";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

export const dynamic = "force-dynamic";

export default function FleetPage() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16">
      <div className="border-b border-[#1F2D3D] pb-5 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5F9]">Broadcast & Distribution</h1>
        <p className="text-sm text-[#94A3B8] mt-2 max-w-3xl leading-relaxed">Connect the places where your approved posts should appear.</p>
      </div>

      <DistributionControlPanel />

      {/* QUICK WORKFLOW SHORTCUTS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-bold text-[#F1F5F9]">Ready to review and publish?</h3>
          <p className="text-xs text-[#94A3B8]">
            Approve drafts in Editorial Studio to broadcast live to your enabled channels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 sm:gap-3">
          <Link
            href="/editorial"
            className="min-h-11 px-4 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00B594] text-[#070B0F] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#00C9A7]/10"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Editorial Studio →</span>
          </Link>
          <Link
            href="/ideas"
            className="min-h-11 px-4 py-2.5 rounded-xl bg-[#0F1419] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] font-medium text-sm flex items-center justify-center gap-2 transition-colors"
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
