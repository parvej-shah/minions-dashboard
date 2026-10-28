import React from "react";
import EditorialStudio from "@/components/editorial/EditorialStudio";
import WeeklyPulseCard from "@/components/pulse/WeeklyPulseCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
};

interface EditorialPageProps {
  searchParams: Promise<{ id?: string; schedule?: string; linkedin?: string }>;
}

/** `?id=` opens a specific draft: the Published page's "Studio" link and /drafts/[id] both use it. `?schedule=1` opens the drafting schedule, `?linkedin=1` the LinkedIn channel. */
export default async function EditorialPage({ searchParams }: EditorialPageProps) {
  const { id, schedule, linkedin } = await searchParams;
  return (
    <>
      {/* The weekly question shows only on the weeks it is open; Studio is the home page. */}
      <div className="mx-auto mb-6 max-w-[1400px] empty:hidden">
        <WeeklyPulseCard />
      </div>
      <EditorialStudio initialDraftId={id} isStandaloneRoute={false} openSchedule={schedule === "1"} openLinkedIn={linkedin === "1"} />
    </>
  );
}
