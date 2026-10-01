"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import type { AssetItem } from "@/types";
import { plainReviewNotes } from "@/lib/drafts/plainNotes";
import LinkedInPostPreview from "./LinkedInPostPreview";
import DraftChecks from "./DraftChecks";

/**
 * The top of a draft in Editorial Studio: the LinkedIn post as a reader will
 * meet it, then what to look at before approving, in plain words. Edits made
 * below show up here as they are typed.
 */
export default function ReaderView({ asset, linkedinText }: { asset: AssetItem; linkedinText: string }) {
  const { data: session } = useSession();
  const notes = useMemo(() => plainReviewNotes(asset), [asset]);
  const text = linkedinText.trim() || [asset.hook, asset.body_content].filter(Boolean).join("\n\n");

  return (
    <section aria-label="How readers will see it" className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] xl:items-start">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-subtle">As readers will see it</p>
        <LinkedInPostPreview
          author={{ name: session?.user?.name ?? "You", image: session?.user?.image ?? null }}
          text={text}
          imageUrl={asset.hero_image_url}
        />
      </div>
      <DraftChecks notes={notes} className="xl:mt-6" />
    </section>
  );
}
