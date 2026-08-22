"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PLANS, type PlanKey } from "@/constants/plans";
import { apiClient, toErrorMessage } from "@/lib/api-client";

const DRAFT_KEY = "minions_onboarding_draft";

interface OnboardingDraft {
  companyName?: string;
  selectedPlan?: PlanKey;
}

/** Reads and clears the pre-redirect draft. Read once, at initial render — see the component doc comment. */
function readAndClearDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {};
  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return {};
  sessionStorage.removeItem(DRAFT_KEY);
  try {
    return JSON.parse(saved) as OnboardingDraft;
  } catch {
    return {};
  }
}

/**
 * Onboarding landing + plan picker.
 *
 * Reachable signed-out (the signup landing) or signed-in-with-no-clientId
 * (proxy.ts redirects here mid-flow). Picking a plan while signed out
 * triggers Google sign-in first (via /api/onboarding/begin's pending-signup
 * cookie), then re-lands here already authenticated to create the Client.
 *
 * signIn() does a full-page navigation to Google and back — this component
 * unmounts and remounts, so companyName/selectedPlan are saved to
 * sessionStorage right before that redirect and restored on the next mount.
 * Confirmed live before this fix: typing a name, picking a plan, and
 * completing Google sign-in landed back here with both silently reset to
 * blank/default, forcing a re-type for no reason.
 */
export default function OnboardingLanding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  // Read once, on mount only — useState's lazy initializer never re-runs, and
  // readAndClearDraft() clears sessionStorage as a side effect of reading it,
  // so a second independent call here would find nothing.
  const [draft] = useState(readAndClearDraft);
  const [companyName, setCompanyName] = useState(draft.companyName ?? "");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(draft.selectedPlan ?? "growth");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    if (!companyName.trim()) {
      setError("Tell us your company name first.");
      return;
    }

    setSubmitting(true);
    try {
      if (status !== "authenticated") {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ companyName, selectedPlan }));
        await fetch("/api/onboarding/begin", { method: "POST" });
        await signIn("google", { callbackUrl: "/onboarding" });
        return; // page reloads after OAuth round trip
      }

      if (!session?.user?.clientId) {
        await apiClient.post("/api/onboarding/client", {
          name: companyName.trim(),
          plan_key: selectedPlan,
        });
        await update(); // force the JWT to pick up the new clientId
      }

      router.push("/onboarding/setup");
    } catch (err) {
      setError(toErrorMessage(err, "Something went wrong. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Set up your content engine</h1>
        <p className="mt-2 text-[#94A3B8]">
          Pick a plan, tell us who you write for, and your first drafts show up automatically.
        </p>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-[#94A3B8] mb-2">Company name</label>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme HVAC"
          className="w-full rounded-lg bg-[#0D1520] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            type="button"
            onClick={() => setSelectedPlan(plan.key)}
            className={`text-left rounded-xl border px-4 py-4 transition-colors ${
              selectedPlan === plan.key
                ? "border-[#00C9A7] bg-[#00C9A7]/5"
                : "border-[#1F2D3D] bg-[#0D1520] hover:border-[#334155]"
            }`}
          >
            <div className="font-semibold">{plan.name}</div>
            <p className="mt-1 text-xs text-[#94A3B8]">{plan.description}</p>
            <div className="mt-3 text-xs font-mono text-[#64748B]">
              {plan.limits.ideasPerWeek} ideas/wk · {plan.limits.assetsPerMonth} posts/mo ·{" "}
              {plan.limits.channels} channel{plan.limits.channels > 1 ? "s" : ""}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-4 py-3 text-sm text-[#ff6b4a]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleStart}
        disabled={submitting}
        className="rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90 disabled:opacity-50"
      >
        {submitting ? "Setting up…" : status === "authenticated" ? "Continue" : "Continue with Google"}
      </button>
    </div>
  );
}
