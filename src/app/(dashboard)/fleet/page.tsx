"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, FileText, Globe } from "lucide-react";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

import { buttonStyles } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Text";
export const dynamic = "force-dynamic";

export default function FleetPage() {
  return (
    <div className="mx-auto max-w-[1040px] space-y-10">
      <PageHeader title="Channels">Where your approved posts go.</PageHeader>

      <DistributionControlPanel />

      {/* QUICK WORKFLOW SHORTCUTS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-bold text-ink">Ready to review and publish?</h3>
          <p className="text-xs text-muted">
            Approve drafts in Editorial Studio and they go to the channels switched on above.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 sm:gap-3">
          <Link
            href="/editorial"
            className={buttonStyles()}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Editorial Studio →</span>
          </Link>
          <Link
            href="/ideas"
            className="min-h-11 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-3 border border-line text-ink font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Idea Stream</span>
          </Link>
          <Link
            href="/posts?show=posted"
            className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-3 border border-line text-ink font-medium text-xs flex items-center gap-2 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-brand" />
            <span>Published Posts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
