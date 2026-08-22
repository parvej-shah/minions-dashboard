"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, toErrorMessage } from "@/lib/api-client";

export default function OnboardingDone() {
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Kicking off your first draft…");

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
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div
        className={`mx-auto mb-6 h-14 w-14 rounded-full flex items-center justify-center text-2xl ${
          status === "error" ? "bg-[#ff6b4a]/10" : "bg-[#00C9A7]/10"
        }`}
      >
        {status === "working" ? "…" : status === "error" ? "!" : "✓"}
      </div>
      <h1 className="text-2xl font-bold mb-2">You&apos;re set up</h1>
      <p className="text-[#94A3B8] mb-8">{message}</p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90"
      >
        Go to your dashboard
      </Link>
    </div>
  );
}
