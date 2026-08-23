import { PLANS } from "@/constants/plans";

export default function StepPlan() {
  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6">
      <h2 className="text-lg font-semibold mb-1">Your plan</h2>
      <p className="text-xs text-[#64748B] mb-4">
        You&apos;re on Starter, free for your first 2 months — no card required.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isSelected = plan.key === "starter";
          const isComingSoon = !isSelected;
          return (
            <div
              key={plan.key}
              className={`relative text-left rounded-xl border px-4 py-4 ${
                isSelected
                  ? "border-[#00C9A7] bg-[#00C9A7]/5"
                  : "border-[#1F2D3D] bg-[#070B0F] opacity-50"
              }`}
            >
              {isSelected && (
                <span className="absolute -top-2.5 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00C9A7] text-[#070B0F]">
                  FREE FOR 2 MONTHS
                </span>
              )}
              {isComingSoon && (
                <span className="absolute -top-2.5 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#161D26] text-[#64748B] border border-[#1F2D3D]">
                  COMING SOON
                </span>
              )}
              <div className="font-semibold">{plan.name}</div>
              <p className="mt-1 text-xs text-[#94A3B8]">{plan.description}</p>
              <div className="mt-3 text-xs font-mono text-[#64748B]">
                {plan.limits.ideasPerWeek} ideas/wk · {plan.limits.assetsPerMonth} posts/mo ·{" "}
                {plan.limits.channels} channel{plan.limits.channels > 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
