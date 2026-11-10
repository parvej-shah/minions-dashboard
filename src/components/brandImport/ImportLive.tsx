"use client";

import { Check, Loader2 } from "lucide-react";
import type { BrandImportRun } from "@/hooks/useBrandImport";
import type { BrandImport, ImportStep } from "@/lib/brandImport/types";

/**
 * The import, live: one card with a row for each part of the brand. A row
 * ticks when its result actually arrives from the server; nothing here is on
 * a timer pretending to work.
 */

/** How much of the brand was found, out of what these sources could give. */
export function importCoverage(result: BrandImport, hadWebsite: boolean) {
  const parts = [
    Boolean(result.identity),
    Boolean(result.focus),
    Boolean(result.icp),
    result.experience.length > 0,
    Boolean(result.voice),
    ...(hadWebsite ? [result.proofs.length > 0] : []),
  ];
  return { found: parts.filter(Boolean).length, total: parts.length };
}

const VOICE_WORDS = {
  formality: { casual: "Casual", balanced: "Balanced", formal: "Formal" },
  sentence_length: { short: "short sentences", mixed: "mixed sentences", long: "long sentences" },
  emoji_use: { never: "no emoji", sometimes: "some emoji", often: "emoji" },
} as const;

type RowState = "done" | "active" | "waiting" | "none";

function Row({ label, value, state }: { label: string; value?: string; state: RowState }) {
  return (
    <li className="flex items-center gap-4 border-b border-line py-4 last:border-b-0 sm:py-5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-subtle">{label}</p>
        {state === "done" && value ? (
          <p className="animate-rise-in mt-1 line-clamp-2 text-[17px] leading-snug text-ink">{value}</p>
        ) : state === "none" ? (
          <p className="mt-1 text-[17px] text-subtle">Nothing found</p>
        ) : (
          <div
            aria-hidden="true"
            className="mt-2 h-3.5 w-2/3 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-surface-2),var(--color-surface-3),var(--color-surface-2))] bg-[length:200%_100%]"
          />
        )}
      </div>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-label={state === "done" ? "Found" : state === "active" ? "Reading" : undefined}>
        {state === "done" ? (
          <Check className="h-5 w-5 animate-pop-in text-success" strokeWidth={2.5} />
        ) : state === "active" ? (
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
        ) : state === "waiting" ? (
          <span className="h-4 w-4 rounded-full border border-line-strong" />
        ) : null}
      </span>
    </li>
  );
}

export function ImportLive({ run, hadWebsite }: { run: BrandImportRun; hadWebsite: boolean }) {
  const { result, steps } = run;
  const done = run.status === "done";
  const failed = run.status === "error";
  const { found, total } = importCoverage(result, hadWebsite);
  const name = result.identity?.name.split(" ")[0];

  const state = (ready: boolean, step: ImportStep): RowState => {
    if (ready) return "done";
    if (done || failed || steps[step].state === "done" || steps[step].state === "skipped") return "none";
    return steps[step].state === "active" ? "active" : "waiting";
  };

  const voice = result.voice?.questionnaire;
  const rows: { label: string; value?: string; state: RowState }[] = [
    { label: "Known for", value: result.focus?.focus, state: state(Boolean(result.focus), "voice") },
    { label: "Who you write for", value: result.icp?.who || undefined, state: state(Boolean(result.icp?.who), "audience") },
    {
      label: "Your experience",
      value: result.experience.length ? `${result.experience.length} thing${result.experience.length === 1 ? "" : "s"} from your work` : undefined,
      state: state(result.experience.length > 0, "experience"),
    },
    {
      label: "Your voice",
      value: voice ? `${VOICE_WORDS.formality[voice.formality]}, ${VOICE_WORDS.sentence_length[voice.sentence_length]}, ${VOICE_WORDS.emoji_use[voice.emoji_use]}` : undefined,
      state: state(Boolean(voice), "voice"),
    },
    ...(hadWebsite
      ? [
          {
            label: "Proof from your website",
            value: result.proofs.length ? `${result.proofs.length} claim${result.proofs.length === 1 ? "" : "s"} for you to check` : undefined,
            state: state(result.proofs.length > 0, "proof"),
          },
        ]
      : []),
  ];

  const title = done ? (name ? `Here's your brand, ${name}.` : "Here's your brand.") : name ? `Hi ${name}. Reading your profile…` : "Reading your profile…";
  const line = done ? `Found ${found} of ${total}. Next, check it over.` : failed ? "The reading stopped partway." : "About 20 seconds. Nothing is saved yet.";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
      <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-ink sm:text-[40px]" aria-live="polite">
        {title}
      </h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted sm:mt-3.5 sm:text-[19px]">{line}</p>
      <ul className="mt-8 rounded-[28px] bg-surface px-5 shadow-soft sm:mt-9 sm:px-6" aria-label="What Minions found">
        {rows.map((row) => (
          <Row key={row.label} {...row} />
        ))}
      </ul>
    </div>
  );
}
