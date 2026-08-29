"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight, Share2, Zap } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useDistributionChannels } from "@/hooks/useDistributionChannels";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

export default function OnboardingDone() {
  const [completeTriggered, setCompleteTriggered] = useState(false);
  const { data: channelData, isLoading: channelsLoading } = useDistributionChannels();
  const selectedChannelKeys = channelData.channels.filter((c) => c.is_active).map((c) => c.key);

  // Kick off initial background harvest run without blocking the UI
  useEffect(() => {
    let isMounted = true;
    apiClient
      .post<{ message: string; run_id?: string }>("/api/onboarding/complete")
      .then(() => {
        if (isMounted) setCompleteTriggered(true);
      })
      .catch((err) => {
        console.warn("Background onboarding complete trigger:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070B0F] text-[#F1F5F9] px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#00C9A7]/10 border border-[#00C9A7]/30 flex items-center justify-center text-[#00C9A7] shadow-xl shadow-[#00C9A7]/10">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#00C9A7]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-[#00C9A7] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F1F5F9] tracking-tight">
            You&apos;re All Set!
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto leading-relaxed">
            Your brand profile, writing voice directives, and distribution channels are calibrated and active.
          </p>
        </div>

        {/* Non-blocking Background Execution Banner */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[#00C9A7]/30 bg-[#00C9A7]/5 flex items-start gap-3.5 shadow-lg">
          <Zap className="w-5 h-5 text-[#00C9A7] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              Generating initial post in background
              <span className="inline-block w-2 h-2 rounded-full bg-[#00C9A7] animate-ping" />
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Minions AI is harvesting your first idea stream and drafting your initial post in the background right now. No need to wait on this screen — head straight to your dashboard!
            </p>
          </div>
        </div>

        {/* Primary Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/?onboarding_success=true"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] font-bold text-sm transition-colors shadow-lg shadow-[#00C9A7]/20"
          >
            <span>Enter Executive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/fleet"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#1F2D3D] hover:border-[#00C9A7]/40 bg-[#0D1520] text-[#94A3B8] hover:text-[#F1F5F9] font-semibold text-xs sm:text-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Manage Fleet Channels</span>
          </Link>
        </div>

        {/* Connected Channels Panel */}
        {!channelsLoading && selectedChannelKeys.length > 0 && (
          <div className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#00C9A7]" />
                Connected Distribution Channels
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Verify or rotate credentials for your broadcast destinations anytime.
              </p>
            </div>
            <DistributionControlPanel channelFilter={selectedChannelKeys} />
          </div>
        )}
      </div>
    </div>
  );
}
