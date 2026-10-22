import React from "react";
import EditorialStudio from "@/components/editorial/EditorialStudio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Studio — Minions Cockpit",
  description: "Executive Content Staging, Typography Reading Lane, Claims Gate & Omnichannel Broadcast Command",
};

interface EditorialPageProps {
  searchParams: Promise<{ id?: string; schedule?: string }>;
}

/** `?id=` opens a specific draft: the Published page's "Studio" link and /drafts/[id] both use it. `?schedule=1` opens the drafting schedule. */
export default async function EditorialPage({ searchParams }: EditorialPageProps) {
  const { id, schedule } = await searchParams;
  return <EditorialStudio initialDraftId={id} isStandaloneRoute={false} openSchedule={schedule === "1"} />;
}
