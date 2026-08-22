"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PLANS, type PlanKey } from "@/constants/plans";
import { apiClient, toErrorMessage } from "@/lib/api-client";

/**
 * Onboarding landing.
 *
 * Sign-in comes first, with nothing else to decide yet -- the company
 * name / plan form only renders once the user is actually authenticated.
 * This used to ask for both *before* Google sign-in, which meant
 * signIn()'s full-page redirect to Google and back unmounted the page with
 * whatever was typed still in local state, and it came back blank (a real
 * bug found by testing the flow live, briefly patched with a sessionStorage
 * round-trip). Reordering the steps removes the problem at its root instead
 * of papering over the redirect: there's nothing to lose across a redirect
 * that happens before any input exists.
 */
export default function OnboardingLanding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("growth");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setSubmitting(true);
    await fetch("/api/onboarding/begin", { method: "POST" });
    await signIn("google", { callbackUrl: "/onboarding" });
  }

  async function handleCreateClient() {
    setError(null);
    if (!companyName.trim()) {
      setError("Tell us your company name first.");
      return;
    }

    setSubmitting(true);
    try {
      if (!session?.user?.clientId) {
        await apiClient.post("/api/onboarding/client", {
          name: companyName.trim(),
          plan_key: selectedPlan,
        });
        await update(); // best-effort JWT refresh; requireClientId() re-checks the DB regardless
      }
      router.push("/onboarding/setup");
    } catch (err) {
      setError(toErrorMessage(err, "Something went wrong. Try again."));
      setSubmitting(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold mb-2">Set up your content engine</h1>
        <p className="text-[#94A3B8] mb-8">
          Sign in to get started. You&apos;ll pick a plan and tell us who you write for next.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={submitting || status === "loading"}
          className="rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90 disabled:opacity-50"
        >
          Continue with Google
        </button>
      </div>
    );
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
        onClick={handleCreateClient}
        disabled={submitting}
        className="rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90 disabled:opacity-50"
      >
        {submitting ? "Setting up…" : "Continue"}
      </button>
    </div>
  );
}
