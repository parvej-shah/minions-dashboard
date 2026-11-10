"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { ICP_LIST_MAX } from "@/constants/contentLanes";
import type { IcpProfileItem } from "@/types";
import { Button } from "@/components/ui/Button";
import ErrorLine from "@/components/ui/ErrorLine";
import { LoadingState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/fieldStyles";
import { BrandCard, Chip, brandText } from "@/components/brand/parts";

type IcpListKey = "pains" | "decisions" | "questions" | "buying_triggers" | "vocabulary";

const ICP_LISTS: { key: IcpListKey; label: string; placeholder: string }[] = [
  { key: "pains", label: "Their biggest problems", placeholder: "A problem that costs them time or money" },
  { key: "decisions", label: "Decisions they are making", placeholder: "A choice they are weighing right now" },
  { key: "questions", label: "Questions they ask you", placeholder: "A question they ask before buying" },
  { key: "buying_triggers", label: "What makes them act", placeholder: "What finally pushes them to act" },
  { key: "vocabulary", label: "Words they use", placeholder: "A word or phrase they use for it" },
];

const BUYER_OPTIONS: { value: IcpProfileItem["buyer"]; label: string; hint: string }[] = [
  { value: "OUTCOME", label: "The outcome", hint: "Business owners and buyers who care what changes, not how it works. Posts lead with results." },
  { value: "TECHNICAL", label: "How it works", hint: "Engineers and technical buyers. Posts can go into the technology." },
];

function ListEditor({ label, placeholder, items, onChange }: { label: string; placeholder: string; items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const id = `icp-list-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const add = () => {
    const value = draft.trim();
    if (!value || items.length >= ICP_LIST_MAX) return;
    if (!items.some((i) => i.toLowerCase() === value.toLowerCase())) onChange([...items, value]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={brandText.label}>{label}</label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip key={item} onRemove={() => onChange(items.filter((i) => i !== item))} removeLabel={`Remove ${item}`}>
              {item}
            </Chip>
          ))}
        </div>
      )}
      {items.length < ICP_LIST_MAX && (
        <input
          id={id}
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

/**
 * The one reader every post is written for. `fields="who"` is the basic card:
 * one sentence. `fields="details"` is the Advanced page with everything else.
 * Both save the whole profile, so neither can drop what the other holds.
 */
export default function IcpEditor({ onChange, fields = "details", onMore }: { onChange: () => void; fields?: "who" | "details"; onMore?: () => void }) {
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
      .catch((err) => !cancelled && setError(toErrorMessage(err, "Couldn't load your reader.")));
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
      setError(toErrorMessage(err, "Couldn't save your reader."));
    } finally {
      setIsSaving(false);
    }
  }

  const basic = fields === "who";
  const title = basic ? "Who you write for" : "Your reader";
  const line = "One reader. Every post is written for this person.";
  if (!icp) return <BrandCard title={title} line={line}>{error ? <ErrorLine text={error} /> : <LoadingState rows={1} />}</BrandCard>;

  const footer = (dirty || isSaving || justSaved) && (
    <div className="flex items-center justify-end gap-3">
      {justSaved && !dirty ? (
        <span role="status" className="text-[15px] text-success">Saved</span>
      ) : (
        <>
          <Button variant="ghost" onClick={() => setIcp(saved)} disabled={isSaving}>Cancel</Button>
          <Button onClick={save} loading={isSaving}>Save</Button>
        </>
      )}
    </div>
  );

  const who = (
    <textarea
      id="icp-who"
      aria-label="Who you write for"
      rows={basic ? 2 : 3}
      value={icp.who}
      onChange={(e) => setIcp({ ...icp, who: e.target.value })}
      placeholder="e.g. Owners of 10-person agencies who do their own sales"
      className={`${inputClass} resize-none text-[17px]`}
    />
  );

  if (basic) {
    return (
      <BrandCard title={title} line={line} action={onMore && <button type="button" onClick={onMore} className={brandText.link}>More detail</button>}>
        {error && <ErrorLine text={error} />}
        {who}
        {footer}
      </BrandCard>
    );
  }

  return (
    <BrandCard title={title} line={line}>
      {error && <ErrorLine text={error} />}
      {who}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={brandText.label} htmlFor="icp-role">Their role</label>
          <input id="icp-role" value={icp.role} onChange={(e) => setIcp({ ...icp, role: e.target.value })} placeholder="Their job title or role" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className={brandText.label} htmlFor="icp-company">Their company</label>
          <input id="icp-company" value={icp.company_type} onChange={(e) => setIcp({ ...icp, company_type: e.target.value })} placeholder="The kind and size of company" className={inputClass} />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className={brandText.label}>What they buy</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BUYER_OPTIONS.map((opt) => (
            <label key={opt.value} className={`flex cursor-pointer gap-3 rounded-2xl p-4 ${icp.buyer === opt.value ? "bg-brand/5 ring-1 ring-brand" : "bg-surface-2"}`}>
              <input type="radio" name="icp-buyer" value={opt.value} checked={icp.buyer === opt.value} onChange={() => setIcp({ ...icp, buyer: opt.value })} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]" />
              <span>
                <span className="block text-[15px] font-medium text-ink">{opt.label}</span>
                <span className="text-sm text-muted">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ICP_LISTS.map(({ key, label, placeholder }) => (
          <ListEditor key={key} label={label} placeholder={placeholder} items={icp[key]} onChange={(items) => setIcp({ ...icp, [key]: items })} />
        ))}
      </div>
      {footer}
    </BrandCard>
  );
}
