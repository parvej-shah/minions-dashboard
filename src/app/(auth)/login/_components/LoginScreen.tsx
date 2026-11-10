"use client";

import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WelcomeArt } from "./WelcomeArt";

const ERROR_MESSAGES: Record<string, string> = {
  SessionExpired: "Your session expired. Sign in again to pick up where you left off.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
};

/**
 * The welcome. Written for founders who know they should post on LinkedIn and
 * don't: one headline, one line, one button. Google is the only sign-in, so the
 * same button serves new and returning people.
 */
export default function LoginScreen() {
  const searchParams = useSearchParams();
  // /onboarding decides on the server where this person belongs: the
  // dashboard for an existing workspace, setup for a new one.
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error ? ERROR_MESSAGES[error] ?? "Sign-in didn't work. Please try again." : null
  );

  useEffect(() => {
    if (!error) return;
    // Drop ?error= so a reload does not show the message again.
    const clean = new URL(window.location.href);
    clean.searchParams.delete("error");
    window.history.replaceState({}, "", clean.pathname + clean.search);
  }, [error]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle(callbackUrl);
    } catch (err) {
      console.error("Sign in error:", err);
      setErrorMessage("Couldn't reach Google. Check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <span className="text-[19px] font-semibold tracking-tight">Minions</span>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 pb-10 sm:px-6 md:flex-row md:items-center md:gap-14">
        <div className="animate-pop-in flex min-w-0 justify-center md:flex-1">
          <WelcomeArt className="h-auto w-full max-w-[300px] md:max-w-[480px]" />
        </div>

        <div className="animate-rise-in flex min-w-0 flex-col md:max-w-[460px] md:flex-1">
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-[44px] lg:text-[52px] lg:leading-[1.06]">
            You&apos;re good at what you do. LinkedIn just doesn&apos;t know it yet.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted sm:mt-5 sm:text-[21px]">
            One post a week from your real work. Nothing goes out until you say yes.
          </p>

          <div className="mt-auto pt-8 md:mt-9 md:pt-0">
            {errorMessage && (
              <p role="alert" className="mb-4 text-[15px] leading-snug text-danger">
                {errorMessage}
              </p>
            )}
            <Button size="lg" block loading={isLoading} onClick={handleGoogleSignIn} className="min-h-14">
              {isLoading ? "Opening Google…" : "Continue with Google"}
            </Button>
            <p className="mt-4 text-center text-[15px] text-subtle">Free for 14 days.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
