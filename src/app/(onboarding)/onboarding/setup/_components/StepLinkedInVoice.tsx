import Link from "next/link";
import { useEffect } from "react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function StepLinkedInVoice({ wizard }: { wizard: OnboardingWizardState }) {
  const { setLinkedInConnected } = wizard;
  useEffect(() => {
    apiClient
      .get<{ channels?: Array<{ key: string; has_credential?: boolean }> }>("/api/channels")
      .then((result) => setLinkedInConnected(Boolean(result.channels?.some((channel) => channel.key === "linkedin" && channel.has_credential))))
      .catch(() => undefined);
  }, [setLinkedInConnected]);

  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-4 sm:p-6 space-y-4 shadow-xl">
      <div>
        <h2 className="text-lg font-bold text-[#F1F5F9]">You&apos;re ready to create</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">Your first ideas will use your audience, industry, and selected writing voice. Tune the full brand brief later from Brand.</p>
      </div>

      {wizard.error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{wizard.error}</div>}

      <div className="rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0077b5] font-serif text-xl font-bold text-white">in</div>
            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9]">LinkedIn publishing <span className="font-normal text-[#64748B]">(optional)</span></h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                {wizard.linkedInConnected ? "LinkedIn is connected for publishing. You can add voice examples separately from Brand." : "Connect now to publish there later. Connecting only verifies your profile; it does not analyze your posts."}
              </p>
            </div>
          </div>
          {wizard.linkedInConnected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00C9A7]" /> : <Link href="/api/auth/linkedin/connect?return_to=/onboarding/setup" prefetch={false} className="shrink-0 rounded-lg border border-[#0077b5]/50 bg-[#0077b5]/10 px-3 py-2 text-xs font-semibold text-[#8ed3ff] hover:bg-[#0077b5]/20"><KeyRound className="mr-1 inline h-3.5 w-3.5" />Connect</Link>}
        </div>
      </div>

      <div className="rounded-xl border border-[#1F2D3D] bg-[#070B0F]/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F1F5F9]">How should posts go live?</h3>
            <p className="mt-1 text-[11px] text-[#94A3B8]">Review is the safe default. Change it any time.</p>
          </div>
          <div className="flex rounded-lg border border-[#1F2D3D] p-1 text-xs font-semibold">
            <button type="button" onClick={() => wizard.setPublishingMode("review")} className={`rounded-md px-3 py-1.5 ${wizard.publishingMode === "review" ? "bg-[#00C9A7] text-[#070B0F]" : "text-[#94A3B8]"}`}>Review</button>
            <button type="button" onClick={() => wizard.setPublishingMode("auto")} className={`rounded-md px-3 py-1.5 ${wizard.publishingMode === "auto" ? "bg-amber-400 text-[#070B0F]" : "text-[#94A3B8]"}`}>Auto</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#1F2D3D]/60 pt-3">
        <button type="button" onClick={wizard.goBack} className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9]"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button type="button" onClick={wizard.finalizeOnboarding} disabled={wizard.saving} className="inline-flex items-center gap-2 rounded-xl bg-[#00C9A7] px-5 py-2.5 text-sm font-bold text-[#070B0F] shadow-lg shadow-[#00C9A7]/20 disabled:opacity-50">
          {wizard.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {wizard.saving ? "Finding ideas…" : "Find my first ideas"}
        </button>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]"><ShieldCheck className="h-3.5 w-3.5 text-[#00C9A7]" />Nothing is published automatically unless you choose Auto.</div>
    </section>
  );
}
