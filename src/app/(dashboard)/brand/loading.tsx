import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

/** The Brand page's shape: the title, then the basics as a column of cards. */
export default function BrandLoading() {
  return (
    <SkeletonGroup label="Loading your brand" className="mx-auto max-w-[760px] space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-11 w-56" />
        <Skeleton className="h-5 w-[min(26rem,90%)]" />
      </div>
      <div className="space-y-6">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="space-y-4 rounded-[28px] bg-surface p-6 shadow-soft sm:p-8">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
