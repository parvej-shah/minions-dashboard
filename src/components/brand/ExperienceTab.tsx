"use client";

import IcpEditor from "@/components/brand/IcpEditor";
import MemorySection from "@/components/brand/MemorySection";
import WeeklyUpdatesPanel from "@/components/pulse/WeeklyUpdatesPanel";

interface ExperienceTabProps {
  /** Called after any save, so the completeness card can refresh. */
  onChange: () => void;
}

/**
 * Who the author writes for, and what they have actually lived. Every idea
 * Minions harvests has to rest on something in here, so this is where the
 * profile grows after onboarding (decision D3), a few items at a time.
 */
export default function ExperienceTab({ onChange }: ExperienceTabProps) {
  return (
    <div className="space-y-6">
      <IcpEditor onChange={onChange} />
      <MemorySection onChange={onChange} />
      <WeeklyUpdatesPanel />
    </div>
  );
}
