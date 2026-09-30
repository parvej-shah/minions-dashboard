"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/ui/Skeleton";
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
    <div className="min-h-screen bg-canvas p-3.5 sm:p-6 md:p-8">
      <PageSkeleton label="Opening your dashboard" />
    </div>
  );
}
