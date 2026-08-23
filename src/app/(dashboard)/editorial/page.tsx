import React from "react";
import EditorialStudio from "@/components/editorial/EditorialStudio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Studio — Minions Cockpit",
  description: "Executive Content Staging, Typography Reading Lane, Claims Gate & Omnichannel Broadcast Command",
};

interface EditorialPageProps {
  searchParams: Promise<{ id?: string }>;
}

/**
 * `?id=` deep-links a specific draft (e.g. Published page's "Studio" link,
 * and /drafts/[id]'s redirect here). Previously silently ignored — this page
 * never read the param, so every deep link landed on whatever draft the
 * queue happened to select first instead of the intended one.
 */
export default async function EditorialPage({ searchParams }: EditorialPageProps) {
  const { id } = await searchParams;
  return <EditorialStudio initialDraftId={id} isStandaloneRoute={false} />;
}
