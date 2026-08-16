"use client";

import React, { use } from "react";
import EditorialStudio from "@/components/editorial/EditorialStudio";

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

export default function DraftDetailPage({ params }: DraftPageProps) {
  const resolvedParams = use(params);
  return (
    <EditorialStudio
      initialDraftId={resolvedParams.id}
      isStandaloneRoute={true}
    />
  );
}
