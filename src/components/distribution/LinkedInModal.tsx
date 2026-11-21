"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import { DistributionControlPanel } from "./DistributionControlPanel";

const LINKEDIN = ["linkedin"];

/** The LinkedIn channel card over Editorial Studio: connect, switch on or off. Sign-in comes back here. */
export default function LinkedInModal({
  isOpen,
  onClose,
  returnTo,
}: {
  isOpen: boolean;
  onClose: () => void;
  returnTo?: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="sheet"
      maxWidthClass="sm:max-w-xl"
      title={
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <span className="text-base font-semibold text-[#0A66C2]" aria-hidden="true">in</span> LinkedIn
          </h2>
          <p className="mt-1 text-sm text-muted">Connect your profile or page. Approved posts go there while it&apos;s on.</p>
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6">
        <DistributionControlPanel channelFilter={LINKEDIN} connectReturnTo={returnTo ?? "/editorial?linkedin=1"} embedded />
      </div>
    </Modal>
  );
}
