import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** Mirrors the Brand tabs and the currently selected editing area while it loads. */
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
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-11 rounded-xl last:col-span-2 sm:w-36" />)}
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 md:flex-row md:items-center">
        <div className="space-y-2 md:w-56"><Skeleton className="h-4 w-40" /><Skeleton className="h-1.5 w-full" /><Skeleton className="h-3 w-48" /></div>
        <div className="grid flex-1 gap-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-14" />)}</div>
      </div>
      {[0].map((item) => (
        <div key={item} className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((card) => <div key={card} className="space-y-4 rounded-2xl border border-line bg-surface p-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-10 w-32" /></div>)}
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}
