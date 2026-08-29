import { useState, useEffect } from "react";
import type { OnboardingWizardState } from "@/hooks/useOnboardingWizard";
import { KeyRound, Sparkles, CheckCircle2, ArrowRight, Loader2, Share2, User, Newspaper } from "lucide-react";
import { apiClient } from "@/lib/api-client";

const CHANNEL_OPTIONS = [
  { key: "linkedin", label: "LinkedIn Profile", desc: "Executive thought-leadership & commentary" },
  { key: "blog", label: "Company Blog", desc: "Live web articles with SEO metadata" },
  { key: "facebook", label: "Facebook Page", desc: "High-resolution photo & timeline updates" },
  { key: "x", label: "X / Twitter", desc: "Short punchy hooks and thread summaries" },
] as const;

function ProfileAvatar({ picture, name }: { picture?: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (picture && !imgError) {
    return (
      <img
        src={picture}
        alt={name}
        onError={() => setImgError(true)}
        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#1F2D3D]"
      />
    );
  }
  return (
    <div className="w-11 h-11 rounded-xl bg-[#00C9A7]/20 border border-[#00C9A7]/30 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-[#00C9A7]">{initials}</span>
    </div>
  );
}

export default function StepLinkedInVoice({ wizard }: { wizard: OnboardingWizardState }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [importing, setImporting] = useState(false);
  const [linkedInDetails, setLinkedInDetails] = useState<{ connected: boolean; externalId?: string } | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res: any = await apiClient.get("/api/channels");
        const li = res?.channels?.find((c: any) => c.key === "linkedin");
        if (li && li.has_credential) {
          setLinkedInDetails({ connected: true, externalId: li.external_id });
          wizard.setLinkedInConnected(true);
        }
      } catch (e) {}
      setCheckingAuth(false);
    }
    checkStatus();
  }, []);

  const handleImport = async () => {
    setImporting(true);
    await wizard.importLinkedInVoice();
    setImporting(false);
  };

  const isConnected = linkedInDetails?.connected || wizard.linkedInConnected;
  const profile = wizard.linkedInProfile;
  const hasImported = wizard.importedVoiceCount > 0 || !!profile;

  return (
    <section className="rounded-2xl border border-[#1F2D3D] bg-[#0D1520] p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-xl">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C9A7] shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold text-[#F1F5F9] leading-snug">Connect &amp; Match Your Voice</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          Connect your LinkedIn profile so Minions can match your natural writing voice and schedule posts on your behalf.
        </p>
      </div>

      {/* LinkedIn Connection Card */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#0077b5]/30 bg-[#0077b5]/5 space-y-4">

        {/* Top row: Logo + info + status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0077b5] flex items-center justify-center text-white font-bold text-lg sm:text-2xl font-serif shrink-0">
              in
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <h3 className="text-sm font-semibold text-[#F1F5F9]">LinkedIn Profile</h3>
                {isConnected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {isConnected
                  ? hasImported ? "Voice calibration complete" : "Tap below to import your writing style"
                  : "1-Click authorization with official LinkedIn Verified App."}
              </p>
            </div>
          </div>

          {isConnected ? (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30 text-xs font-semibold transition-colors shrink-0"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {hasImported ? "Re-sync Voice" : "Import My Voice"}
            </button>
          ) : (
            <a
              href="/api/auth/linkedin/connect?return_to=/onboarding/setup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0077b5] hover:bg-[#0077b5]/90 text-white text-xs font-semibold transition-colors shrink-0 shadow-md shadow-[#0077b5]/20"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Connect with 1-Click</span>
            </a>
          )}
        </div>

        {/* Manual post paste box until API verification completes */}
        {isConnected && (
          <div className="pt-3 border-t border-[#0077b5]/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#94A3B8]">
                Paste a sample post or profile bio <span className="text-[#64748B] font-normal">(optional until LinkedIn API review completes)</span>:
              </label>
            </div>
            <textarea
              rows={3}
              value={wizard.customSampleText}
              onChange={(e) => wizard.setCustomSampleText(e.target.value)}
              placeholder='e.g. "Clear systems beat clever strategies every time..." — Paste any post or bio sample to calibrate your voice instantly.'
              className="w-full rounded-xl bg-[#070B0F] border border-[#1F2D3D] p-3 text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7] text-xs leading-relaxed"
            />
          </div>
        )}

        {/* Profile preview card — shown after successful import */}
        {hasImported && profile && (
          <div className="rounded-xl bg-[#0D1520] border border-[#1F2D3D] p-3.5 space-y-3">
            {/* Profile header */}
            <div className="flex items-center gap-3">
              <ProfileAvatar picture={profile.profilePicture} name={profile.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F1F5F9] truncate">{profile.name}</p>
                {profile.headline && (
                  <p className="text-xs text-[#94A3B8] truncate mt-0.5">{profile.headline}</p>
                )}
                {profile.company && (
                  <p className="text-[11px] text-[#00C9A7] mt-0.5">{profile.company}</p>
                )}
              </div>
              <div className="ml-auto shrink-0 flex items-center gap-1 text-[11px] text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Voice matched</span>
              </div>
            </div>

            {/* Post snippet preview */}
            {wizard.postSnippet && (
              <div className="flex items-start gap-2 pt-2 border-t border-[#1F2D3D]/60">
                <Newspaper className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-[#64748B] mb-0.5 font-mono uppercase tracking-wide">Sample post imported</p>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-3">
                    &ldquo;{wizard.postSnippet}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* AI suggestions ready badge */}
            {wizard.aiSuggestions && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#1F2D3D]/60">
                <Sparkles className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
                <p className="text-[11px] text-[#00C9A7]">
                  AI-generated brand interview suggestions ready based on your posts
                </p>
              </div>
            )}
          </div>
        )}

        {/* Importing loading state */}
        {importing && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C9A7]" />
            <span>Analysing your LinkedIn posts &amp; generating personalised interview starters…</span>
          </div>
        )}
      </div>

      {/* Distribution Channels Selector */}
      <div className="pt-4 border-t border-[#1F2D3D]/60">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Where should Minions publish?</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {CHANNEL_OPTIONS.map((c) => {
            const isSelected = wizard.channels.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => wizard.toggleChannel(c.key)}
                className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-[#00C9A7]/10 border-[#00C9A7] ring-1 ring-[#00C9A7]"
                    : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#00C9A7]/40"
                }`}
              >
                <div>
                  <h4 className="text-xs font-semibold text-[#F1F5F9]">{c.label}</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{c.desc}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00C9A7] flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-end pt-4 border-t border-[#1F2D3D]/60">
        <button
          type="button"
          onClick={() => wizard.setStep(1)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] font-bold text-sm transition-colors shadow-lg shadow-[#00C9A7]/20 cursor-pointer"
        >
          <span>Next: Company Profile</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
