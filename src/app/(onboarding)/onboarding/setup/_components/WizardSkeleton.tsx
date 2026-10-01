import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** The lesson screen's shape: progress bar, mascot question, answer field, footer. */
export function WizardSkeleton() {
  return (
    <SkeletonGroup label="Loading your brand brief" className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 flex-1 rounded-full" />
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 sm:px-6 sm:pt-8">
        <div className="flex items-end gap-3">
          <Skeleton className="h-14 w-14 rounded-2xl sm:h-16 sm:w-16" />
          <Skeleton className="h-16 flex-1 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
      <div className="border-t-2 border-line">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 py-4 sm:px-6 sm:py-5">
          <Skeleton className="h-14 w-full rounded-2xl sm:w-48" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
