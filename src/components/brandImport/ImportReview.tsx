"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight, X } from "lucide-react";
import type { BrandImport, ImportedIcp } from "@/lib/brandImport/types";

/**
 * One screen to check what the import found before any of it is saved. It
 * reads like a list, not a form: click a line to change it. Website claims
 * get their own question, and unticked proof is never saved, because drafts
 * cite proof as verified.
 */

const LIST_LABELS: { key: Exclude<keyof ImportedIcp, "who" | "role" | "company_type">; label: string; noun: string }[] = [
  { key: "pains", label: "Their problems", noun: "problems" },
  { key: "questions", label: "Questions they ask", noun: "questions" },
  { key: "decisions", label: "Decisions they weigh", noun: "decisions" },
  { key: "buying_triggers", label: "What makes them buy now", noun: "buying triggers" },
  { key: "vocabulary", label: "Words they use", noun: "words" },
];

const VOICE_TEXT = {
  formality: { casual: "Casual", balanced: "Balanced", formal: "Formal" },
  sentence_length: { short: "short sentences", mixed: "a mix of short and long sentences", long: "longer sentences" },
  humor: { none: "no jokes", light: "a little humor", frequent: "plenty of humor" },
  emoji_use: { never: "no emoji", sometimes: "the odd emoji", often: "emoji" },
} as const;

const card = "rounded-[28px] bg-surface px-5 shadow-soft sm:px-6";
const row = "border-b border-line py-4 last:border-b-0 sm:py-5";

/** A line of the list: the label, the value, and a › that opens it. */
function RowButton({ label, value, open, onClick }: { label: string; value: ReactNode; open?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} className="group flex w-full items-center gap-4 text-left cursor-pointer">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-subtle">{label}</span>
        <span className="mt-1 block text-[17px] leading-snug text-ink">{value}</span>
      </span>
      <ChevronRight
        className={`h-5 w-5 shrink-0 text-subtle transition-transform group-hover:text-ink ${open ? "rotate-90" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

/** A line that turns into a text box when clicked. */
function EditableRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div>
        <label className="block text-[13px] text-subtle">
          {label}
          <textarea
            autoFocus
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            className="mt-1.5 block w-full resize-none rounded-[14px] border border-brand bg-surface px-3.5 py-2.5 text-[17px] leading-snug text-ink focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </div>
    );
  }
  return <RowButton label={label} value={value || <span className="text-subtle">Click to add</span>} onClick={() => setEditing(true)} />;
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 rounded-full p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
    >
      <X className="h-4 w-4" />
    </button>
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
  const [icpOpen, setIcpOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);

  const icpLists = icp ? LIST_LABELS.filter(({ key }) => icp[key].length > 0) : [];
  const experienceCount = result.experience.length;

  return (
    <div>
      <ul className={card}>
        {showFocus && result.focus && (
          <li className={row}>
            <EditableRow label="Known for" value={result.focus.focus} onChange={(focus) => onChange({ ...result, focus: { ...result.focus!, focus } })} />
          </li>
        )}

        {icp && (icp.who || showFocus) && (
          <li className={row}>
            <EditableRow label="Who you write for" value={icp.who} onChange={(who) => setIcp({ who })} />
          </li>
        )}

        {icp && icpLists.length > 0 && (
          <li className={row}>
            <RowButton
              label="What they care about"
              value={icpLists.map(({ key, noun }) => `${icp[key].length} ${noun}`).join(", ")}
              open={icpOpen}
              onClick={() => setIcpOpen((o) => !o)}
            />
            {icpOpen && (
              <div className="animate-rise-in mt-4 space-y-4">
                {icpLists.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-[13px] text-subtle">{label}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {icp[key].map((item) => (
                        <li key={item} className="flex min-w-0 items-center gap-0.5 rounded-full bg-surface-2 py-0.5 pr-0.5 pl-3 text-[15px] text-ink">
                          <span className="min-w-0 break-words">{item}</span>
                          <RemoveButton label={`Remove ${item}`} onClick={() => setIcp({ [key]: icp[key].filter((x) => x !== item) })} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        )}

        {voice && (
          <li className={row}>
            <label className="flex w-full items-center gap-4 cursor-pointer">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-subtle">Your voice</span>
                <span className="mt-1 block text-[17px] leading-snug text-ink">
                  {VOICE_TEXT.formality[voice.formality]}, {VOICE_TEXT.sentence_length[voice.sentence_length]}, {VOICE_TEXT.humor[voice.humor]},{" "}
                  {VOICE_TEXT.emoji_use[voice.emoji_use]}
                </span>
              </span>
              <span className="shrink-0 text-[15px] text-muted">Use it</span>
              <input type="checkbox" checked={keepVoice} onChange={(e) => onKeepVoice(e.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--color-brand)]" />
            </label>
          </li>
        )}

        {experienceCount > 0 && (
          <li className={row}>
            <RowButton
              label="Your experience"
              value={`${experienceCount} thing${experienceCount === 1 ? "" : "s"} from your work`}
              open={experienceOpen}
              onClick={() => setExperienceOpen((o) => !o)}
            />
            {experienceOpen && (
              <ul className="animate-rise-in mt-3 space-y-1">
                {result.experience.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 rounded-[14px] bg-surface-2 py-2 pr-1.5 pl-3.5">
                    <textarea
                      rows={2}
                      value={item.content}
                      aria-label="This experience"
                      onChange={(e) => onChange({ ...result, experience: result.experience.map((x) => (x.id === item.id ? { ...x, content: e.target.value } : x)) })}
                      className="min-w-0 flex-1 resize-none bg-transparent py-0.5 text-[15px] leading-snug text-ink focus:outline-none"
                    />
                    <RemoveButton label="Remove this experience" onClick={() => onChange({ ...result, experience: result.experience.filter((x) => x.id !== item.id) })} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}
      </ul>

      {result.proofs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[21px] font-semibold text-ink">Which of these are true today?</h2>
          <p className="mt-1.5 text-[15px] text-muted">From your website. Posts only use the ones you tick.</p>
          <ul className={`${card} mt-4`}>
            {result.proofs.map((proof) => (
              <li key={proof.id} className={row}>
                <label className="flex items-start gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvedProofs.includes(proof.id)}
                    onChange={() => onToggleProof(proof.id)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
                  />
                  <span className="min-w-0 flex-1 text-[17px] leading-snug text-ink">{proof.claim}</span>
                </label>
                <a
                  href={proof.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 ml-[34px] block truncate text-[13px] text-subtle hover:text-brand"
                >
                  {proof.source_title || proof.source_url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
