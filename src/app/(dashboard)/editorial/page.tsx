import React from "react";
import EditorialStudio from "@/components/editorial/EditorialStudio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review",
};

interface EditorialPageProps {
  searchParams: Promise<{ id?: string; schedule?: string; linkedin?: string }>;
}

/** `?id=` opens a specific draft: the Published page's "Studio" link and /drafts/[id] both use it. `?schedule=1` opens the drafting schedule, `?linkedin=1` the LinkedIn channel. */
export default async function EditorialPage({ searchParams }: EditorialPageProps) {
  const { id, schedule, linkedin } = await searchParams;
  return (
    <EditorialStudio initialDraftId={id} isStandaloneRoute={false} openSchedule={schedule === "1"} openLinkedIn={linkedin === "1"} />
  );
}
