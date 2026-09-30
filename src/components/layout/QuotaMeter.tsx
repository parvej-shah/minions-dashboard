import type { NavCounts } from "@/types";

export interface QuotaMeterProps {
  quota: NavCounts["quota"];
  /** Sidebar renders it full-width with a label row; the mobile top bar
   *  renders a compact pill instead. */
  compact?: boolean;
}

/**
 * "X / N Posts Used" this billing month, against the tenant's plan limit
 * (`src/constants/plans.ts`). Reads the same numbers `/api/usage/check`
 * will eventually gate on, so the meter and the real enforcement can never
 * disagree once that lands.
 */
export default function QuotaMeter({ quota, compact = false }: QuotaMeterProps) {
  const { used, limit } = quota;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isOver = used >= limit;
  const isNear = !isOver && pct >= 80;
  const barColor = isOver ? "bg-danger" : isNear ? "bg-gold" : "bg-brand";
  const textColor = isOver ? "text-danger" : isNear ? "text-gold" : "text-muted";

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161d24] border border-[#1f2b37] text-[10px] font-mono"
        title={`${used} of ${limit} posts used this month (${quota.planKey} plan)`}
      >
        <span className={`font-bold ${textColor}`}>
          {used}/{limit}
        </span>
        <span className="text-subtle">posts</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-subtle uppercase tracking-wider">
          {quota.planKey} plan
        </span>
        <span className={`font-bold ${textColor}`}>
          {used} / {limit} Posts Used
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#0b0f14] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
