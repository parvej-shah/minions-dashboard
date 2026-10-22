"use client";

import React from "react";
import { CalendarClock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ScheduleSettings from "./ScheduleSettings";

/** The drafting schedule as a sheet over Editorial Studio, so it sits next to the drafts it produces. */
export default function DraftScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="sheet"
      maxWidthClass="sm:max-w-3xl"
      title={
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <CalendarClock className="h-5 w-5 text-brand" aria-hidden="true" /> Drafting schedule
          </h2>
          <p className="mt-1 text-sm text-muted">Set your pace once. Minions follows it until you change it.</p>
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6">
        <ScheduleSettings />
      </div>
    </Modal>
  );
}
