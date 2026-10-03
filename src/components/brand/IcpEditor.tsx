"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Target, X } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { ICP_LIST_MAX } from "@/constants/contentLanes";
import type { IcpProfileItem } from "@/types";
import { buttonStyles } from "@/components/ui/Button";
import ErrorLine from "@/components/ui/ErrorLine";
import { LoadingState } from "@/components/ui/EmptyState";
import { inputClass, sectionClass } from "@/components/ui/fieldStyles";

type IcpListKey = "pains" | "decisions" | "questions" | "buying_triggers" | "vocabulary";

const ICP_LISTS: { key: IcpListKey; label: string; placeholder: string }[] = [
  { key: "pains", label: "Their biggest problems", placeholder: "A problem that costs them time or money" },
  { key: "decisions", label: "Decisions they are making", placeholder: "A choice they are weighing right now" },
  { key: "questions", label: "Questions they ask you", placeholder: "A question they ask before buying" },
  { key: "buying_triggers", label: "What makes them act", placeholder: "What finally pushes them to act" },
  { key: "vocabulary", label: "Words they use", placeholder: "A word or phrase they use for it" },
];

function ListEditor({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const value = draft.trim();
    if (!value || items.length >= ICP_LIST_MAX) return;
    if (!items.some((i) => i.toLowerCase() === value.toLowerCase())) onChange([...items, value]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <label htmlFor={`icp-list-${label.replace(/\W+/g, "-").toLowerCase()}`} className="text-xs font-semibold text-muted">{label}</label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-2 py-1 text-xs text-ink"
            >
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((i) => i !== item))}
                className="text-subtle hover:text-red-400 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {items.length < ICP_LIST_MAX && (
        <input
          id={`icp-list-${label.replace(/\W+/g, "-").toLowerCase()}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

export default function IcpEditor({ onChange }: { onChange: () => void }) {
  const [icp, setIcp] = useState<IcpProfileItem | null>(null);
  const [saved, setSaved] = useState<IcpProfileItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<IcpProfileItem>("/api/brand/icp")
      .then((row) => {
        if (!cancelled) {
          setIcp(row);
          setSaved(row);
        }
      })
      .catch((err) => !cancelled && setError(toErrorMessage(err, "Couldn't load your ideal customer.")));
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => JSON.stringify(icp) !== JSON.stringify(saved), [icp, saved]);

  async function save() {
    if (!icp) return;
    setIsSaving(true);
    setError(null);
    try {
      const row = await apiClient.put<IcpProfileItem>("/api/brand/icp", icp);
      setIcp(row);
      setSaved(row);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      onChange();
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't save your ideal customer."));
    } finally {
      setIsSaving(false);
    }
  }

  if (!icp) return error ? <ErrorLine text={error} /> : <LoadingState />;

  return (
    <div className={sectionClass}>
      <div>
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <Target className="w-4 h-4 text-brand" />
          Your ideal customer
        </h3>
        <p className="text-xs text-muted mt-0.5">
          One reader. Every idea is written for this person, so the more specific, the better.
        </p>
      </div>

      {error && <ErrorLine text={error} />}

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted" htmlFor="icp-who">
          Who they are
        </label>
        <textarea
          id="icp-who"
          rows={2}
          value={icp.who}
          onChange={(e) => setIcp({ ...icp, who: e.target.value })}
          placeholder="One specific reader: what they do, the size of their business, and where they are in it."
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted" htmlFor="icp-role">
            Their role
          </label>
          <input id="icp-role" value={icp.role} onChange={(e) => setIcp({ ...icp, role: e.target.value })} placeholder="Their job title or role" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted" htmlFor="icp-company">
            Their company
          </label>
          <input
            id="icp-company"
            value={icp.company_type}
            onChange={(e) => setIcp({ ...icp, company_type: e.target.value })}
            placeholder="The kind and size of company they work in"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ICP_LISTS.map(({ key, label, placeholder }) => (
          <ListEditor key={key} label={label} placeholder={placeholder} items={icp[key]} onChange={(items) => setIcp({ ...icp, [key]: items })} />
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line/60 pt-4">
        {justSaved && (
          <span className="flex items-center gap-1 text-xs text-brand">
            <Check className="h-3.5 w-3.5" /> Saved. Your audience rule now matches this profile.
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || isSaving}
          className={buttonStyles({ size: "sm" })}
        >
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save ideal customer
        </button>
      </div>
    </div>
  );
}
