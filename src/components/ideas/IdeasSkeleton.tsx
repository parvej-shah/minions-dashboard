import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

export default function IdeasSkeleton() {
  return (
    <SkeletonGroup label="Loading your ideas" className="mx-auto max-w-7xl space-y-6 pb-16">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)] p-5 sm:p-7">
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </section>

      <div className="flex justify-end border-b border-line pb-4">
        <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
      </div>

      <div className="sticky top-14 z-30 -mx-4 space-y-3 border-b border-line bg-canvas px-4 pb-3.5 pt-3 shadow-xl shadow-black/40 sm:-mx-6 sm:px-6 md:-mx-8 md:top-0 md:px-8">
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <div className="hidden items-center gap-2 border-t border-line/40 pt-2 lg:flex">
          <Skeleton className="h-6 w-12" />
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-4 rounded-2xl border-2 border-b-4 border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between border-t border-line pt-3">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
