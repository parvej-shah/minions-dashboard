"use client";

import { useEffect, useMemo, useState } from "react";
import WeeklyUpdatesPanel from "@/components/pulse/WeeklyUpdatesPanel";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";
import {
  ICP_LIST_MAX,
  MEMORY_DISCLOSURE_META,
  MEMORY_DISCLOSURES,
  MEMORY_KIND_META,
  MEMORY_KINDS,
  MEMORY_MAX_CHARS,
  MEMORY_MIN_CHARS,
  type MemoryDisclosure,
  type MemoryKind,
} from "@/constants/contentLanes";
import type { IcpProfileItem, MemoryCheckResult, MemoryItem } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
const inputClass =
  "w-full rounded-lg bg-canvas border border-line px-3 py-2 text-sm text-ink placeholder:text-[#475569] focus:outline-none focus:border-brand";
const cardClass = "p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm";

type IcpListKey = "pains" | "decisions" | "questions" | "buying_triggers" | "vocabulary";

const ICP_LISTS: { key: IcpListKey; label: string; placeholder: string }[] = [
  { key: "pains", label: "Their biggest problems", placeholder: "A problem that costs them time or money" },
  { key: "decisions", label: "Decisions they are making", placeholder: "A choice they are weighing right now" },
  { key: "questions", label: "Questions they ask you", placeholder: "A question they ask before buying" },
  { key: "buying_triggers", label: "What makes them act", placeholder: "What finally pushes them to act" },
  { key: "vocabulary", label: "Words they use", placeholder: "A word or phrase they use for it" },
];

interface ExperienceTabProps {
  /** Called after any save, so the completeness card can refresh. */
  onChange: () => void;
}

/**
 * Who the author writes for, and what they have actually lived. Every idea
 * Minions harvests has to rest on something in here, so this is where the
 * profile grows after onboarding (decision D3), a few items at a time.
 */
export default function ExperienceTab({ onChange }: ExperienceTabProps) {
  return (
    <div className="space-y-6">
      <IcpEditor onChange={onChange} />
      <MemorySection onChange={onChange} />
      <WeeklyUpdatesPanel />
    </div>
  );
}

// ---------------------------------------------------------------- ICP

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
      <label className="text-xs font-semibold text-muted">{label}</label>
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

function IcpEditor({ onChange }: { onChange: () => void }) {
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
    <div className={cardClass}>
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

// ---------------------------------------------------------------- memory

function ErrorLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

interface Draft {
  id: string | null;
  kind: MemoryKind;
  content: string;
  disclosure: MemoryDisclosure;
}

const EMPTY_DRAFT: Draft = { id: null, kind: "LESSON", content: "", disclosure: "PUBLIC" };

function MemorySection({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<MemoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<MemoryItem[]>("/api/brand/memory")
      .then((rows) => !cancelled && setItems(rows))
      .catch((err) => !cancelled && setError(toErrorMessage(err, "Couldn't load your experience.")));
    return () => {
      cancelled = true;
    };
  }, []);

  function upsert(item: MemoryItem) {
    setItems((prev) => {
      const list = prev ?? [];
      return list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [item, ...list];
    });
    onChange();
  }

  async function patch(item: MemoryItem, body: Partial<Pick<MemoryItem, "disclosure" | "is_active">>) {
    setError(null);
    try {
      upsert(await apiClient.patch<MemoryItem>(`/api/brand/memory/${item.id}`, body));
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't update that item."));
    }
  }

  async function remove(item: MemoryItem) {
    const previous = items;
    setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
    try {
      await apiClient.delete(`/api/brand/memory/${item.id}`);
      onChange();
    } catch (err) {
      setItems(previous);
      setError(toErrorMessage(err, "Couldn't remove that item."));
    }
  }

  if (!items) return error ? <ErrorLine text={error} /> : <LoadingState />;

  const grouped = MEMORY_KINDS.map((kind) => ({ kind, rows: items.filter((i) => i.kind === kind) })).filter((g) => g.rows.length);

  return (
    <div className={cardClass}>
      <div>
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" />
          Experience &amp; activity
          <span className="rounded bg-line px-1.5 py-0.5 font-mono text-[10px] text-muted">{items.length}</span>
        </h3>
        <p className="text-xs text-muted mt-0.5">
          What you have built, learned and seen. Minions only proposes ideas it can back with something here, so
          anything you add makes your posts more yours. Never add anything confidential.
        </p>
      </div>

      {error && <ErrorLine text={error} />}

      <Composer draft={draft} setDraft={setDraft} onSaved={(item) => { upsert(item); setDraft(EMPTY_DRAFT); }} />

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-subtle">
          Nothing yet. Start with one lesson from a project that did not go to plan.
        </p>
      ) : (
        <div className="space-y-5 border-t border-line/60 pt-4">
          {grouped.map(({ kind, rows }) => (
            <div key={kind} className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-subtle">{MEMORY_KIND_META[kind].label}</h4>
              {rows.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border border-line bg-canvas px-3 py-2.5 ${item.is_active ? "" : "opacity-50"}`}
                >
                  <p className="whitespace-pre-wrap text-sm text-ink">{item.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => patch(item, { disclosure: item.disclosure === "PUBLIC" ? "GENERALIZE" : "PUBLIC" })}
                      title={MEMORY_DISCLOSURE_META[item.disclosure].hint}
                      className="rounded border border-line px-1.5 py-0.5 text-muted hover:text-ink cursor-pointer"
                    >
                      {MEMORY_DISCLOSURE_META[item.disclosure].label}
                    </button>
                    <span className="text-subtle">
                      {item.used_in_ideas === 0 ? "Not used yet" : `Used in ${item.used_in_ideas} idea${item.used_in_ideas === 1 ? "" : "s"}`}
                    </span>
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() => patch(item, { is_active: !item.is_active })}
                      aria-label={item.is_active ? "Stop using this" : "Use this again"}
                      title={item.is_active ? "Stop using this" : "Use this again"}
                      className="rounded p-1 text-subtle hover:text-ink cursor-pointer"
                    >
                      {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ id: item.id, kind: item.kind, content: item.content, disclosure: item.disclosure })}
                      aria-label="Edit"
                      className="rounded p-1 text-subtle hover:text-ink cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      aria-label="Delete"
                      className="rounded p-1 text-subtle hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Add or edit one item. Saving runs the generalization check first: contact
 * details, secrets and anything confidential block the save; names, places
 * and figures are shown with a rewrite that removes them.
 */
function Composer({
  draft,
  setDraft,
  onSaved,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSaved: (item: MemoryItem) => void;
}) {
  const [check, setCheck] = useState<MemoryCheckResult | null>(null);
  const [busy, setBusy] = useState<"checking" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const length = draft.content.trim().length;
  const valid = length >= MEMORY_MIN_CHARS && length <= MEMORY_MAX_CHARS;

  function update(next: Partial<Draft>) {
    setDraft({ ...draft, ...next });
    setCheck(null);
  }

  async function persist(content: string) {
    setBusy("saving");
    setError(null);
    try {
      const body = { kind: draft.kind, content, disclosure: draft.disclosure };
      const item = draft.id
        ? await apiClient.patch<MemoryItem>(`/api/brand/memory/${draft.id}`, body)
        : await apiClient.post<MemoryItem>("/api/brand/memory", body);
      setCheck(null);
      onSaved(item);
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't save that."));
    } finally {
      setBusy(null);
    }
  }

  async function checkThenSave() {
    if (!valid) return;
    setBusy("checking");
    setError(null);
    try {
      const result = await apiClient.post<MemoryCheckResult>("/api/brand/memory/check", {
        content: draft.content,
        disclosure: draft.disclosure,
      });
      if (result.issues.length === 0 && !result.confidential) {
        await persist(draft.content);
        return;
      }
      setCheck(result);
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't check that text."));
    } finally {
      setBusy((b) => (b === "checking" ? null : b));
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-[#0B1016] p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[200px_1fr]">
        <select
          value={draft.kind}
          onChange={(e) => update({ kind: e.target.value as MemoryKind })}
          aria-label="Kind of experience"
          className={`${inputClass} cursor-pointer`}
        >
          {MEMORY_KINDS.map((k) => (
            <option key={k} value={k}>
              {MEMORY_KIND_META[k].label}
            </option>
          ))}
        </select>
        <p className="self-center text-[11px] text-subtle">{MEMORY_KIND_META[draft.kind].hint}</p>
      </div>

      <textarea
        rows={3}
        value={draft.content}
        onChange={(e) => update({ content: e.target.value })}
        placeholder="Be specific: what happened, what you did, what changed."
        aria-label="Experience"
        className={`${inputClass} resize-y`}
      />

      <div className="flex flex-wrap items-center gap-2">
        {MEMORY_DISCLOSURES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => update({ disclosure: d })}
            className={`rounded-lg border px-2.5 py-1.5 text-left text-xs cursor-pointer ${
              draft.disclosure === d ? "border-brand bg-brand/10 text-ink" : "border-line text-muted hover:text-ink"
            }`}
          >
            <span className="font-semibold">{MEMORY_DISCLOSURE_META[d].label}</span>
            <span className="ml-1.5 text-subtle">{MEMORY_DISCLOSURE_META[d].hint}</span>
          </button>
        ))}
        <span className="flex-1" />
        <span className={`text-[11px] ${length > MEMORY_MAX_CHARS ? "text-red-400" : "text-subtle"}`}>
          {length}/{MEMORY_MAX_CHARS}
        </span>
        {draft.id && (
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setCheck(null);
            }}
            className="rounded-lg px-3 py-2 text-xs text-muted hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={checkThenSave}
          disabled={!valid || busy !== null || check !== null}
          className={buttonStyles({ size: "sm" })}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : draft.id ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {busy === "checking" ? "Checking…" : draft.id ? "Save changes" : "Add"}
        </button>
      </div>

      {length > 0 && length < MEMORY_MIN_CHARS && (
        <p className="text-[11px] text-subtle">A little more detail: at least {MEMORY_MIN_CHARS} characters.</p>
      )}
      {error && <ErrorLine text={error} />}

      {check && (
        <div className={`space-y-3 rounded-lg border px-3 py-3 ${check.confidential ? "border-red-500/40 bg-red-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          <p className="flex items-start gap-2 text-xs font-semibold text-ink">
            <ShieldAlert className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${check.confidential ? "text-red-400" : "text-amber-400"}`} />
            {check.confidential
              ? "This looks confidential. Minions doesn't keep confidential material, so remove it or use the version below."
              : draft.disclosure === "GENERALIZE"
                ? "You chose Generalize, but this names specifics that would identify someone."
                : "This names people or companies other than you. Their privacy isn't yours to share."}
          </p>
          {check.issues.length > 0 && (
            <ul className="space-y-1">
              {check.issues.map((issue) => (
                <li key={issue.text} className="text-xs text-muted">
                  <span className="rounded bg-line px-1 py-0.5 font-mono text-ink">{issue.text}</span> {issue.reason}
                </li>
              ))}
            </ul>
          )}
          {!check.model_checked && (
            <p className="text-[11px] text-subtle">The name check is unavailable right now; only contact details, secrets and figures were checked.</p>
          )}
          {check.generalized && (
            <div className="rounded-lg border border-line bg-canvas px-3 py-2">
              <p className="mb-1 text-[11px] font-mono uppercase tracking-wider text-subtle">Without the specifics</p>
              <p className="text-sm text-ink">{check.generalized}</p>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setCheck(null)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-ink cursor-pointer"
            >
              Keep editing
            </button>
            {!check.confidential && (
              <button
                type="button"
                onClick={() => persist(draft.content)}
                disabled={busy !== null}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:border-[#2A3D52] disabled:opacity-50 cursor-pointer"
              >
                Save as written
              </button>
            )}
            {check.generalized && (
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, content: check.generalized! });
                  setCheck(null);
                }}
                className={buttonStyles({ size: "sm" })}
              >
                Use this version
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
