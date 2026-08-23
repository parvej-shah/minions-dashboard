"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useDistributionChannels } from "@/hooks/useDistributionChannels";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

type Stage = "harvesting" | "drafting" | "ready" | "failed";

interface PipelineRunPayload {
  status: "RUNNING" | "COMPLETED" | "FAILED";
  metadata?: { assetId?: string } | null;
}

const STAGE_LABELS: Record<Exclude<Stage, "failed">, string> = {
  harvesting: "Harvesting your first ideas",
  drafting: "Drafting your first post",
  ready: "Ready",
};

function StageRow({
  label,
  state,
}: {
  label: string;
  state: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
        {state === "done" ? (
          <CheckCircle2 className="w-5 h-5 text-[#00C9A7]" />
        ) : state === "active" ? (
          <Loader2 className="w-5 h-5 text-[#F59E0B] animate-spin" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-[#1F2D3D]" />
        )}
      </div>
      <span
        className={`text-sm ${
          state === "done" ? "text-[#94A3B8]" : state === "active" ? "text-[#F1F5F9] font-medium" : "text-[#64748B]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function OnboardingDone() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("harvesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const harvestRunId = useRef<string | null>(null);
  const draftRunId = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const { data: channelData, isLoading: channelsLoading } = useDistributionChannels();
  const selectedChannelKeys = channelData.channels.filter((c) => c.is_active).map((c) => c.key);

  // Kick off the harvest run.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .post<{ message: string; run_id?: string }>("/api/onboarding/complete")
      .then((res) => {
        if (cancelled) return;
        if (!res.run_id) {
          // No run to poll (e.g. Stripe/n8n not configured) -- fall back to
          // the plain "you're set up" state rather than polling forever.
          setStage("failed");
          setErrorMessage(res.message);
          return;
        }
        harvestRunId.current = res.run_id;
      })
      .catch((err) => {
        if (cancelled) return;
        setStage("failed");
        setErrorMessage(toErrorMessage(err, "The first harvest run didn't start automatically."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll whichever run is currently active; auto-chain harvest -> draft.
  useEffect(() => {
    if (stage === "ready" || stage === "failed") return;

    const poll = async () => {
      const runId = stage === "harvesting" ? harvestRunId.current : draftRunId.current;
      if (!runId) return;

      try {
        const run = await apiClient.get<PipelineRunPayload>(`/api/pipeline/runs/${runId}`);

        if (run.status === "FAILED") {
          setStage("failed");
          setErrorMessage(
            stage === "harvesting"
              ? "The harvest run failed to complete."
              : "The drafting run failed to complete."
          );
          return;
        }

        if (run.status === "COMPLETED") {
          if (stage === "harvesting") {
            const draft = await apiClient.post<{ success: boolean; run_id: string; message?: string }>(
              "/api/pipeline/draft",
              { idea_id: null }
            );
            if (!draft.success) {
              setStage("failed");
              setErrorMessage(draft.message ?? "Could not start the drafting run.");
              return;
            }
            draftRunId.current = draft.run_id;
            setStage("drafting");
          } else {
            const assetId = run.metadata?.assetId;
            if (assetId) {
              router.push(`/editorial?id=${encodeURIComponent(assetId)}`);
            } else {
              setStage("ready");
            }
          }
        }
      } catch (err) {
        setStage("failed");
        setErrorMessage(toErrorMessage(err, "Lost connection while checking progress."));
      }
    };

    pollRef.current = setInterval(poll, 3500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [stage, router]);

  const showProgress = stage !== "failed";

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div
          className={`mx-auto mb-6 h-14 w-14 rounded-full flex items-center justify-center text-2xl ${
            stage === "failed" ? "bg-[#ff6b4a]/10" : "bg-[#00C9A7]/10"
          }`}
        >
          {stage === "failed" ? <X className="w-6 h-6 text-[#ff6b4a]" /> : <CheckCircle2 className="w-6 h-6 text-[#00C9A7]" />}
        </div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re set up</h1>
        {stage === "failed" && (
          <p className="text-[#94A3B8]">
            {errorMessage ?? "Setup is saved, but the first run didn't start. You can trigger it manually from Idea Stream."}
          </p>
        )}
      </div>

      {showProgress && (
        <div className="mb-8 rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-5">
          <StageRow
            label={STAGE_LABELS.harvesting}
            state={stage === "harvesting" ? "active" : "done"}
          />
          <StageRow
            label={STAGE_LABELS.drafting}
            state={stage === "harvesting" ? "pending" : stage === "drafting" ? "active" : "done"}
          />
        </div>
      )}

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
