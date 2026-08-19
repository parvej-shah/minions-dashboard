import React from "react";
import EditorialStudio from "@/components/editorial/EditorialStudio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Studio — Minions Cockpit",
  description: "Executive Content Staging, Typography Reading Lane, Claims Gate & Omnichannel Broadcast Command",
};

export default function EditorialPage() {
  return <EditorialStudio isStandaloneRoute={false} />;
}
