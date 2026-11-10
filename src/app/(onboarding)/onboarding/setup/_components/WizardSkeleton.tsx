import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** A setup screen's shape: wordmark and step bar, title, one line, one card, footer. */
export function WizardSkeleton() {
  return (
    <SkeletonGroup label="Loading setup" className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-1 flex-1 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 sm:px-6 sm:pt-10">
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="mt-4 h-5 w-3/5" />
        <Skeleton className="mt-9 h-44 w-full rounded-[28px]" />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl justify-end px-4 py-3 sm:px-6 sm:py-4">
          <Skeleton className="h-12 w-44 rounded-full" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
