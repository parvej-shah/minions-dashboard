"use client";

import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Lightbulb, PenLine, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ERROR_MESSAGES: Record<string, string> = {
  SessionExpired: "Your session expired. Sign in again to pick up where you left off.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
};

/** The three things Minions does, in the order it does them. */
const STEPS = [
  { icon: Lightbulb, title: "Find", text: "Ideas from your own experience", tint: "text-gold bg-gold/10" },
  { icon: PenLine, title: "Write", text: "Drafts in your voice", tint: "text-brand bg-brand/10" },
  { icon: Send, title: "Publish", text: "LinkedIn and your blog", tint: "text-coral bg-coral/10" },
];

function GoogleMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default function LoginScreen() {
  const searchParams = useSearchParams();
  // /onboarding decides on the server where this person belongs: the
  // dashboard for an existing workspace, the brand brief for a new one.
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
      <header className="mx-auto flex w-full max-w-5xl items-center px-5 py-5">
        <span className="text-2xl font-bold tracking-tight">
          Minions<span className="text-brand">.AI</span>
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-10">
        <div className="animate-pop-in mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-line bg-surface">
          <Image src="/icon.svg" alt="" width={64} height={64} priority className="h-16 w-16" />
        </div>

        <h1 className="animate-rise-in mt-7 text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Your expertise,
          <br />
          posted every week.
        </h1>
        <p className="animate-rise-in mt-3 text-center text-base leading-relaxed text-muted [animation-delay:60ms]">
          Minions turns what you know into posts that sound like you.
        </p>

        <ol className="animate-rise-in mt-7 grid grid-cols-3 gap-2 [animation-delay:120ms]">
          {STEPS.map(({ icon: Icon, title, text, tint }) => (
            <li key={title} className="flex flex-col items-center rounded-2xl border border-line bg-surface px-2 py-3 text-center">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mt-2 text-sm font-semibold">{title}</span>
              <span className="mt-0.5 text-xs leading-snug text-subtle">{text}</span>
            </li>
          ))}
        </ol>

        {errorMessage && (
          <div role="alert" className="story-shake mt-6 flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss"
              className="rounded-lg p-1 text-danger hover:bg-danger/20 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="animate-rise-in mt-7 space-y-3 [animation-delay:180ms]">
          <Button variant="light" size="lg" block loading={isLoading} icon={<GoogleMark />} onClick={handleGoogleSignIn}>
            {isLoading ? "Opening Google…" : "Continue with Google"}
          </Button>
          <p className="text-center text-sm text-subtle">Free for 14 days · No card needed</p>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 text-xs text-subtle">
        <p>© 2026 Minions.AI</p>
        <Link href="/docs" className="hover:text-muted">
          Documentation
        </Link>
      </footer>
    </div>
  );
}
