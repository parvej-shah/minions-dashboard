"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function OnboardingDone() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Fire background complete trigger
    apiClient
      .post<{ message: string; run_id?: string }>("/api/onboarding/complete")
      .catch((err) => console.warn("Background onboarding complete trigger:", err));

    // Redirect immediately to dashboard with success toast
    if (isMounted) {
      router.replace("/?onboarding_success=true");
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070B0F] text-[#F1F5F9] flex flex-col items-center justify-center p-6 space-y-3">
      <Loader2 className="w-8 h-8 text-[#00C9A7] animate-spin" />
      <p className="text-xs text-[#94A3B8] font-mono">Redirecting to your executive dashboard…</p>
    </div>
  );
}
