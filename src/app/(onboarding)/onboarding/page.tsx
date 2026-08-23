"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiClient, ApiRequestError, toErrorMessage } from "@/lib/api-client";

/**
 * Onboarding landing.
 *
 * Sign-in comes first, with nothing else to decide yet -- the company
 * name form only renders once the user is actually authenticated. This
 * used to ask for both company name AND plan *before* Google sign-in,
 * which meant signIn()'s full-page redirect to Google and back unmounted
 * the page with whatever was typed still in local state, and it came back
 * blank (a real bug found by testing the flow live, briefly patched with a
 * sessionStorage round-trip). Reordering the steps removes the problem at
 * its root instead of papering over the redirect: there's nothing to lose
 * across a redirect that happens before any input exists.
 *
 * Plan selection itself moved out of this page entirely -- see
 * setup/_components/StepPlan.tsx, the wizard's last step. Every account
 * starts on Starter (the only plan that's actually wired up; plan_key
 * isn't persisted anywhere yet, see /api/onboarding/client), so asking
 * for a plan choice before the user has even seen what the product does
 * was pure friction for a decision that doesn't do anything yet.
 */
const DEFAULT_PLAN_KEY = "starter";

export default function OnboardingLanding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
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
          plan_key: DEFAULT_PLAN_KEY,
        });
        await update(); // best-effort JWT refresh; requireClientId() re-checks the DB regardless
      }
      router.push("/onboarding/setup");
    } catch (err) {
      // A 401 here means the session cookie is still valid (JWT decodes fine)
      // but the User row it points to is gone from the DB -- e.g. an old
      // session outliving a deleted test account. useSession() still reports
      // "authenticated" in that case, so without this the form just sits
      // there re-showing a raw "Unauthorized" forever with no way out. Sign
      // out to clear the stale cookie and send them back through a real
      // Google sign-in, which provisions (or re-finds) a live User row.
      if (err instanceof ApiRequestError && err.status === 401) {
        setError("Your session expired. Signing you out — please sign in again.");
        await signOut({ callbackUrl: "/onboarding" });
        return;
      }
      setError(toErrorMessage(err, "Something went wrong. Try again."));
      setSubmitting(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold mb-2">Set up your content engine</h1>
        <p className="text-[#94A3B8] mb-8">
          Sign in to get started. You&apos;ll tell us who you write for next.
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
          Free on Starter for your first 2 months — tell us who you write for and your first drafts show up automatically.
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
