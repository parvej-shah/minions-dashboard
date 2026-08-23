"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { buildOnboardingPreview, type PreviewInput, type PreviewOutput } from "@/lib/onboarding-preview";

export default function LivePreviewPanel(props: PreviewInput) {
  const [preview, setPreview] = useState<PreviewOutput | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreview(buildOnboardingPreview(props));
    }, 300);
    return () => clearTimeout(timer);
  }, [props.industry, props.icpDescription, props.channels, props.formality]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!preview) return null;

  return (
    <aside className="lg:sticky lg:top-16 h-fit rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-5 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 mb-4 text-[11px] font-mono text-[#00C9A7] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-pulse" />
        <span>Live preview</span>
      </div>

      <div key={preview.headline} className="animate-in fade-in duration-200">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#ff6b4a] shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-[#F1F5F9] leading-snug">{preview.headline}</p>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{preview.angleSummary}</p>
        <p className="text-[11px] font-mono text-[#64748B]">{preview.channelLabel}</p>
      </div>

      <p className="mt-4 pt-3 border-t border-[#1F2D3D]/60 text-[10px] text-[#475569]">
        Here&apos;s a taste of what we&apos;ll write about — your real first draft comes from the pipeline.
      </p>
    </aside>
  );
}
