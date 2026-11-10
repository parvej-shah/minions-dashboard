import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** The first-post screen's shape: wordmark, a centered title and line, a thin bar. */
export function WaitingSkeleton() {
  return (
    <SkeletonGroup label="Loading your first post" className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-4 sm:px-6 sm:py-5">
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
        <Skeleton className="mt-9 h-1 w-60 rounded-full" />
      </div>
    </SkeletonGroup>
  );
}
