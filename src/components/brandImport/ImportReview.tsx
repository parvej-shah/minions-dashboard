"use client";

import { useState, type ReactNode } from "react";
import { BadgeCheck, Briefcase, Check, ExternalLink, Mic2, Pencil, Target, Users2, X } from "lucide-react";
import type { BrandImport, ImportedIcp } from "@/lib/brandImport/types";

/**
 * One screen to check what the import found before any of it is saved. It
 * reads like a summary, not a form: tap × to drop something, the pencil to
 * fix it, and tick the website claims that are true. Unticked proof is never
 * saved, because drafts cite proof as verified.
 */

const LIST_LABELS: { key: Exclude<keyof ImportedIcp, "who" | "role" | "company_type">; label: string }[] = [
  { key: "pains", label: "Their problems" },
  { key: "questions", label: "Questions they ask" },
  { key: "decisions", label: "Decisions they weigh" },
  { key: "buying_triggers", label: "What makes them buy now" },
  { key: "vocabulary", label: "Words they use" },
];

const VOICE_TEXT = {
  formality: { casual: "casual", balanced: "balanced", formal: "formal" },
  sentence_length: { short: "short sentences", mixed: "a mix of short and long sentences", long: "longer sentences" },
  humor: { none: "no jokes", light: "a little humor", frequent: "plenty of humor" },
  emoji_use: { never: "no emoji", sometimes: "the odd emoji", often: "emoji" },
} as const;

function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-line bg-surface p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-subtle">
        <span className="text-brand">{icon}</span>
        {title}
      </h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Text that reads as plain text until the pencil turns it into a box. */
function EditableText({ value, onChange, label, big }: { value: string; onChange: (v: string) => void; label: string; big?: boolean }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <textarea
        autoFocus
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        aria-label={label}
        className="w-full resize-none rounded-xl border-2 border-brand bg-surface-2 px-3 py-2 text-base leading-relaxed text-ink focus:outline-none"
      />
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} className="group flex w-full items-start gap-2 text-left cursor-pointer" aria-label={`Edit ${label}`}>
      <span className={`flex-1 leading-snug text-ink ${big ? "text-lg font-bold" : "text-base"}`}>{value || <span className="text-subtle">Tap to add</span>}</span>
      <Pencil className="mt-1 h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-brand" />
    </button>
  );
}

function RemovableChip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-1 rounded-lg bg-surface-2 py-1 pr-1 pl-2.5 text-sm text-ink">
      {children}
      <button type="button" onClick={onRemove} aria-label="Remove" className="rounded-md p-0.5 text-subtle transition-colors hover:bg-surface-3 hover:text-ink cursor-pointer">
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

export function ImportReview({
  result,
  onChange,
  approvedProofs,
  onToggleProof,
  keepVoice,
  onKeepVoice,
  showFocus,
}: {
  result: BrandImport;
  onChange: (next: BrandImport) => void;
  approvedProofs: string[];
  onToggleProof: (id: string) => void;
  keepVoice: boolean;
  onKeepVoice: (keep: boolean) => void;
  /** Onboarding asks what they want to be known for; the Brand page keeps its own. */
  showFocus: boolean;
}) {
  const icp = result.icp;
  const setIcp = (next: Partial<ImportedIcp>) => icp && onChange({ ...result, icp: { ...icp, ...next } });
  const voice = result.voice?.questionnaire;

  return (
    <div className="space-y-4">
      {showFocus && result.focus && (
        <Section icon={<Target className="h-4 w-4" />} title="Known for">
          <EditableText big label="what you want to be known for" value={result.focus.focus} onChange={(focus) => onChange({ ...result, focus: { ...result.focus!, focus } })} />
        </Section>
      )}

      {icp && (
        <Section icon={<Users2 className="h-4 w-4" />} title="Who you write for">
          {(icp.who || showFocus) && <EditableText label="who you write for" value={icp.who} onChange={(who) => setIcp({ who })} />}
          <div className="mt-2 space-y-3">
            {LIST_LABELS.filter(({ key }) => icp[key].length > 0).map(({ key, label }) => (
              <div key={key}>
                <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-subtle">{label}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {icp[key].map((item) => (
                    <RemovableChip key={item} onRemove={() => setIcp({ [key]: icp[key].filter((x) => x !== item) })}>
                      {item}
                    </RemovableChip>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.experience.length > 0 && (
        <Section icon={<Briefcase className="h-4 w-4" />} title={`Your experience · ${result.experience.length}`} hint="Facts from your profile that posts can draw on.">
          <ul className="space-y-2">
            {result.experience.map((item) => (
              <li key={item.id} className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <EditableText
                    label="this experience"
                    value={item.content}
                    onChange={(content) => onChange({ ...result, experience: result.experience.map((e) => (e.id === item.id ? { ...e, content } : e)) })}
                  />
                  <span className="mt-1 block text-[11px] font-bold text-subtle">from {item.from}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...result, experience: result.experience.filter((e) => e.id !== item.id) })}
                  aria-label="Remove this experience"
                  className="rounded-lg p-1 text-subtle transition-colors hover:bg-surface-3 hover:text-ink cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {voice && (
        <Section icon={<Mic2 className="h-4 w-4" />} title="Your voice">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={keepVoice} onChange={(e) => onKeepVoice(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--color-brand)]" />
            <span className="text-base leading-snug text-ink">
              You write {VOICE_TEXT.formality[voice.formality]}, with {VOICE_TEXT.sentence_length[voice.sentence_length]}, {VOICE_TEXT.humor[voice.humor]} and{" "}
              {VOICE_TEXT.emoji_use[voice.emoji_use]}.
              {voice.signature_phrases.length > 0 && <span className="block text-sm text-muted">Phrases you use: “{voice.signature_phrases.join("”, “")}”</span>}
              {result.voice?.about && <span className="mt-1 block text-sm text-muted">Your About section is kept as a sample of your writing.</span>}
            </span>
          </label>
        </Section>
      )}

      {result.proofs.length > 0 && (
        <Section
          icon={<BadgeCheck className="h-4 w-4" />}
          title="Proof from your site"
          hint="Posts may cite these as fact. Tick only what is true today."
        >
          <ul className="space-y-2">
            {result.proofs.map((proof) => {
              const on = approvedProofs.includes(proof.id);
              return (
                <li key={proof.id} className={`rounded-xl border-2 transition-colors ${on ? "border-brand bg-brand/10" : "border-line bg-surface-2 hover:border-line-strong"}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => onToggleProof(proof.id)}
                    className="flex w-full items-start gap-3 p-3 pb-1 text-left cursor-pointer"
                  >
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-brand bg-brand text-brand-ink" : "border-line-strong"}`}>
                      {on && <Check className="h-4 w-4 animate-pop-in" strokeWidth={3.5} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink">{proof.claim}</span>
                      <span className="mt-1 block text-sm italic text-muted">“{proof.quote}”</span>
                    </span>
                  </button>
                  <a
                    href={proof.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-2.5 ml-12 inline-flex items-center gap-1 text-xs font-bold text-subtle hover:text-brand"
                  >
                    {proof.source_title || proof.source_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </div>
  );
}
