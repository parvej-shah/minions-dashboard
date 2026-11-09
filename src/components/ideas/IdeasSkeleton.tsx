import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

export default function IdeasSkeleton() {
  return (
    <SkeletonGroup label="Loading your ideas" className="mx-auto max-w-[840px] space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-3"><Skeleton className="h-12 w-40" /><Skeleton className="h-4 w-96 max-w-full" /></div>
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
      <div className="flex flex-wrap justify-between gap-3"><Skeleton className="h-11 w-72 rounded-full" /><Skeleton className="h-11 w-60 rounded-full" /></div>
      <div className="divide-y divide-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-5 py-6">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-28" /></div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
