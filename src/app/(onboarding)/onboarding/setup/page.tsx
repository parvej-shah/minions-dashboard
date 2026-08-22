"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, toErrorMessage } from "@/lib/api-client";

const CHANNEL_OPTIONS = [
  { key: "blog", label: "Blog" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X / Twitter" },
] as const;

const TONE_FORMALITY = ["technical_direct", "tactile_operator", "conversational_peer"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#1F2D3D] bg-[#0D1520] p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]";

export default function OnboardingSetup() {
  const router = useRouter();

  const [industry, setIndustry] = useState("");
  const [icpDescription, setIcpDescription] = useState("");
  const [channels, setChannels] = useState<string[]>(["blog"]);

  const [formality, setFormality] = useState<(typeof TONE_FORMALITY)[number]>("conversational_peer");
  const [examples, setExamples] = useState(["", "", ""]);

  const [tokenChannel, setTokenChannel] = useState<"facebook" | "linkedin" | "x">("facebook");
  const [token, setToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleChannel(key: string) {
    setChannels((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  async function saveToken() {
    if (!token.trim()) return;
    setError(null);
    try {
      await apiClient.post("/api/onboarding/channel-token", {
        channel: tokenChannel,
        token: token.trim(),
      });
      setTokenSaved((prev) => [...prev.filter((c) => c !== tokenChannel), tokenChannel]);
      setToken("");
    } catch (err) {
      setError(toErrorMessage(err, "Could not save that token."));
    }
  }

  async function handleContinue() {
    setError(null);
    if (!industry.trim() || !icpDescription.trim()) {
      setError("Industry and who-you-write-for are both required.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/onboarding/setup", {
        industry: industry.trim(),
        icp_description: icpDescription.trim(),
        channels,
      });

      const filledExamples = examples.map((e) => e.trim()).filter(Boolean);
      await apiClient.post("/api/onboarding/voice", {
        tone_questionnaire: { formality },
        examples: filledExamples.length >= 3 ? filledExamples : [],
      });

      router.push("/onboarding/done");
    } catch (err) {
      setError(toErrorMessage(err, "Something went wrong. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Tell us who you write for</h1>
      <p className="text-[#94A3B8] mb-8">This shapes every idea and draft the pipeline generates.</p>

      <Section title="Industry & audience">
        <label className="block text-sm font-medium text-[#94A3B8] mb-2">Industry</label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Residential plumbing"
          className={`${inputClass} mb-4`}
        />
        <label className="block text-sm font-medium text-[#94A3B8] mb-2">
          Who&apos;s your ideal reader, and what do you want them to take away?
        </label>
        <textarea
          value={icpDescription}
          onChange={(e) => setIcpDescription(e.target.value)}
          rows={4}
          placeholder="e.g. Owners of 5-20 truck plumbing companies who miss emergency calls after hours..."
          className={inputClass}
        />
      </Section>

      <Section title="Channels">
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleChannel(c.key)}
              className={`rounded-full border px-4 py-2 text-sm ${
                channels.includes(c.key)
                  ? "border-[#00C9A7] bg-[#00C9A7]/10 text-[#00C9A7]"
                  : "border-[#1F2D3D] text-[#94A3B8]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Section>

      {(channels.includes("facebook") || channels.includes("linkedin") || channels.includes("x")) && (
        <Section title="Connect your social accounts">
          <p className="text-xs text-[#64748B] mb-4">
            Paste an access token for each channel you enabled above. We store it encrypted — never
            in plain text — and only use it to publish on your behalf.
          </p>
          <div className="flex gap-2 mb-3">
            <select
              value={tokenChannel}
              onChange={(e) => setTokenChannel(e.target.value as typeof tokenChannel)}
              className="rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-2 text-sm"
            >
              {CHANNEL_OPTIONS.filter((c) => c.key !== "blog" && channels.includes(c.key)).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Access token"
              type="password"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={saveToken}
              className="rounded-lg border border-[#1F2D3D] px-4 py-2 text-sm hover:border-[#00C9A7]"
            >
              Save
            </button>
          </div>
          {tokenSaved.length > 0 && (
            <p className="text-xs text-[#00C9A7]">Saved: {tokenSaved.join(", ")}</p>
          )}
        </Section>
      )}

      <Section title="Voice">
        <label className="block text-sm font-medium text-[#94A3B8] mb-2">Overall tone</label>
        <select
          value={formality}
          onChange={(e) => setFormality(e.target.value as typeof formality)}
          className={`${inputClass} mb-4`}
        >
          <option value="technical_direct">Technical & direct</option>
          <option value="tactile_operator">Grounded & operational</option>
          <option value="conversational_peer">Conversational</option>
        </select>

        <label className="block text-sm font-medium text-[#94A3B8] mb-2">
          Paste 3 example posts that sound like you (optional, but improves voice match)
        </label>
        {examples.map((value, i) => (
          <textarea
            key={i}
            value={value}
            onChange={(e) =>
              setExamples((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
            }
            rows={3}
            placeholder={`Example post ${i + 1}`}
            className={`${inputClass} mb-3`}
          />
        ))}
      </Section>

      {error && (
        <div className="mb-6 rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-4 py-3 text-sm text-[#ff6b4a]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className="rounded-lg bg-[#00C9A7] px-6 py-3 font-semibold text-[#070B0F] hover:bg-[#00C9A7]/90 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}
