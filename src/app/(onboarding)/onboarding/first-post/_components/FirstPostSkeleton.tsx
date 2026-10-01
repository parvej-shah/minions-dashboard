import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** The first-post screen's shape: progress bar, a big badge and title, a card. */
export function WaitingSkeleton() {
  return (
    <SkeletonGroup label="Loading your first post" className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 flex-1 rounded-full" />
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 pt-10 sm:px-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="mt-8 h-8 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-56 max-w-full" />
        <Skeleton className="mt-10 h-64 w-full rounded-2xl" />
      </div>
    </SkeletonGroup>
  );
}
