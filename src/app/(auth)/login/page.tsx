import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeRouteFor } from "@/lib/homeRoute";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import LoginScreen from "./_components/LoginScreen";

/** Same outline as LoginScreen, so nothing jumps when it hydrates. */
function LoginSkeleton() {
  return (
    <SkeletonGroup label="Loading sign-in" className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="mx-auto h-24 w-24 rounded-[28px]" />
        <Skeleton className="mx-auto h-9 w-64" />
        <Skeleton className="mx-auto h-4 w-72 max-w-full" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-14 rounded-2xl" />
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
