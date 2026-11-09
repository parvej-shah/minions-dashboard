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
      <span className={`text-sm ${textColor}`} title={`${used} of ${limit} posts used this month (${quota.planKey} plan)`}>
        {used}/{limit} posts
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Posts this month</span>
        <span className={textColor}>
          {used} of {limit}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
