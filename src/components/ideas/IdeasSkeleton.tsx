import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

export default function IdeasSkeleton() {
  return (
    <SkeletonGroup label="Loading your ideas" className="mx-auto max-w-[840px] space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-3">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <Skeleton className="h-11 w-72 rounded-full" />
        <Skeleton className="h-11 w-60 rounded-full" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl sm:rounded-[22px] border border-line/60 bg-surface p-5 sm:p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-line/40">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="space-y-2 py-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-line/40">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
