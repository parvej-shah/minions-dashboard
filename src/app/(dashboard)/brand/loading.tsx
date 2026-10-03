import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** Keeps Brand navigation and its foundation cards in view while the page loads. */
export default function BrandLoading() {
  return (
    <SkeletonGroup label="Loading your brand" className="mx-auto max-w-7xl space-y-7 pb-16">
      <div className="space-y-5 border-b border-line pb-5">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-1 h-10 w-10 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-[min(26rem,90%)]" />
            <Skeleton className="h-4 w-[min(32rem,95%)]" />
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden rounded-2xl border-2 border-line bg-surface p-1">
          <Skeleton className="h-11 w-36 shrink-0" />
          <Skeleton className="h-11 w-32 shrink-0" />
          <Skeleton className="h-11 w-48 shrink-0" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-4 rounded-2xl border-2 border-line bg-surface p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-32" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
