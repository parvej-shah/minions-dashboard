import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeRouteFor } from "@/lib/homeRoute";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import LoginScreen from "./_components/LoginScreen";

/** Same outline as LoginScreen, so nothing jumps when it hydrates. */
function LoginSkeleton() {
  return (
    <SkeletonGroup label="Loading sign-in" className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 pb-10 sm:px-6 md:flex-row md:items-center md:gap-14">
        <Skeleton className="mx-auto aspect-[4/3] w-full max-w-[300px] rounded-[28px] md:max-w-[480px] md:flex-1" />
        <div className="w-full space-y-4 md:max-w-[460px] md:flex-1">
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
