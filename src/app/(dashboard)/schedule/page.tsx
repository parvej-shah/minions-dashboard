"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/Text";
import ScheduleSettings from "@/components/schedule/ScheduleSettings";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Back to Today
        </Link>
        <div className="mt-2">
          <PageHeader title="Publishing Pace">
            Set your pace once. Minions prepares and stages drafts while you work.
          </PageHeader>
        </div>
      </div>

      <ScheduleSettings />
    </div>
  );
}
