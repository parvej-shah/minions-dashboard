"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useDistributionChannels } from "@/hooks/useDistributionChannels";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

export default function OnboardingDone() {
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Kicking off your first draft…");

  // Only the channels the tenant actually picked during setup are active
  // yet -- see /api/onboarding/setup's fix ensuring every other catalogue
  // channel starts inactive, so this filter reflects their real choice, not
  // GET /api/channels' defaultActive fallback.
  const { data: channelData, isLoading: channelsLoading } = useDistributionChannels();
  const selectedChannelKeys = channelData.channels.filter((c) => c.is_active).map((c) => c.key);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .post<{ message: string }>("/api/onboarding/complete")
      .then((res) => {
        if (cancelled) return;
        setStatus("done");
        setMessage(res.message);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(toErrorMessage(err, "Setup is saved, but the first harvest run didn't start."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="text-center">
        <div
          className={`mx-auto mb-6 h-14 w-14 rounded-full flex items-center justify-center text-2xl ${
            status === "error" ? "bg-[#ff6b4a]/10" : "bg-[#00C9A7]/10"
          }`}
        >
          {status === "working" ? "…" : status === "error" ? "!" : "✓"}
        </div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re set up</h1>
        <p className="text-[#94A3B8] mb-8">{message}</p>
      </div>

      {!channelsLoading && selectedChannelKeys.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#F1F5F9] mb-1">Connect your channels</h2>
          <p className="text-xs text-[#64748B] mb-4">
            Add credentials now, or skip and connect them later from Fleet.
          </p>
          <DistributionControlPanel channelFilter={selectedChannelKeys} />
        </div>
      )}

      <div className="text-center space-y-3">
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90"
        >
          Go to your dashboard
        </Link>
        <div>
          <Link href="/fleet" className="text-xs text-[#64748B] hover:text-[#94A3B8]">
            Skip for now — connect later from Fleet
          </Link>
        </div>
      </div>
    </div>
  );
}
