"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ScheduleSettings from "./ScheduleSettings";

/** The drafting schedule as a sheet over Editorial Studio, with a quick link to the dedicated /schedule page. */
export default function DraftScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="sheet"
      maxWidthClass="sm:max-w-3xl"
      title={
        <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
              <CalendarClock className="h-5 w-5 text-brand" aria-hidden="true" /> Publishing Pace
            </h2>
            <p className="mt-1 text-xs text-muted">Set your pace once. Minions follows it until you change it.</p>
          </div>
          <Link
            href="/schedule"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:underline"
          >
            Open as page <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6">
        <ScheduleSettings />
      </div>
    </Modal>
  );
}
