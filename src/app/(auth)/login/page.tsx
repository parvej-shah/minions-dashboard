import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeRouteFor } from "@/lib/homeRoute";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import LoginScreen from "./_components/LoginScreen";

/** Same outline as LoginScreen, so nothing jumps when it hydrates. */
function LoginSkeleton() {
  return (
    <SkeletonGroup label="Loading sign-in" className="min-h-dvh bg-canvas md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="px-3 pt-3 md:h-dvh md:p-3">
        <Skeleton className="h-[clamp(220px,36dvh,380px)] w-full rounded-[28px] md:h-full md:rounded-[32px]" />
      </div>
      <div className="flex flex-col px-6 sm:px-10 md:min-h-dvh md:px-14 lg:px-20">
        <Skeleton className="mt-8 hidden h-6 w-24 md:block" />
        <div className="flex flex-1 flex-col justify-center space-y-4 pt-7 md:max-w-[440px] md:py-12">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-8 h-14 w-full rounded-full" />
        </div>
      </div>
    </SkeletonGroup>
  );
}

/**
 * Someone already signed in never sees the sign-in screen: they go straight to
 * their dashboard (or to finish setup), decided before anything renders.
 */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect(await homeRouteFor(session));

  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginScreen />
    </Suspense>
  );
}
