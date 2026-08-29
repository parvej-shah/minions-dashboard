"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingLanding() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (session?.user?.clientId) {
      router.replace("/editorial");
    } else {
      router.replace("/onboarding/setup");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-[#070B0F] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#94A3B8] font-mono">Routing to your workspace…</p>
      </div>
    </div>
  );
}
