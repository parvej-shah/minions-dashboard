"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WelcomeArt } from "./WelcomeArt";

/** Google's "G", in its own colours, as Google's sign-in guidelines ask. */
function GoogleMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    </span>
  );
}

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
    <div className="min-h-dvh bg-canvas text-ink md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* The editorial panel: full height on desktop, a framed card on phones. */}
      <div className="animate-pop-in relative px-3 pt-3 md:sticky md:top-0 md:h-dvh md:p-3">
        <WelcomeArt className="h-[clamp(220px,36dvh,380px)] md:h-full" />
        {/* On phones the wordmark rides on the panel, so the sign-in column starts with the headline. */}
        <span className="absolute left-6 top-6 rounded-full bg-canvas/90 px-3 py-2 md:hidden"><span className="inline-flex items-baseline gap-2"><Image src="/images/post-studio-wordmark.png" alt="Minions Post Studio" width={1051} height={147} priority className="h-[14px] w-auto" /><span className="text-[13px] font-medium text-muted">By Minions.AI</span></span></span>
      </div>

      <div className="flex flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 md:min-h-dvh md:px-14 lg:px-20">
        <header className="hidden pt-8 md:block">
          <span className="inline-flex items-baseline gap-2"><Image src="/images/post-studio-wordmark.png" alt="Minions Post Studio" width={1051} height={147} priority className="h-[22px] w-auto" /><span className="text-[13px] font-medium text-muted">By Minions.AI</span></span>
        </header>

        <main className="animate-rise-in flex flex-1 flex-col justify-center pt-7 md:max-w-[440px] md:py-12">
          <h1 className="text-[32px] leading-[1.08] font-semibold tracking-[-0.025em] text-balance sm:text-[42px] lg:text-[48px] lg:leading-[1.04]">
            You&apos;re good at what you do. LinkedIn just doesn&apos;t know it yet.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted text-pretty sm:mt-5 sm:text-[19px]">
            One post a week from your real work. Nothing goes out until you say yes.
          </p>

          <div className="mt-7 sm:mt-10">
            {errorMessage && (
              <p role="alert" className="mb-4 rounded-xl bg-danger/[0.06] px-4 py-3 text-[15px] leading-snug text-danger">
                {errorMessage}
              </p>
            )}
            <Button
              size="lg"
              block
              loading={isLoading}
              icon={<GoogleMark />}
              onClick={handleGoogleSignIn}
              className="min-h-14 rounded-full shadow-[0_8px_24px_-8px_rgba(0,102,204,0.55)] transition-[transform,box-shadow] active:scale-[0.98] motion-reduce:transition-none"
            >
              {isLoading ? "Opening Google…" : "Continue with Google"}
            </Button>
            <p className="mt-4 text-center text-[15px] text-subtle">Free for 14 days.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
