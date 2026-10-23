"use client";

import { Suspense, useEffect, useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, User, Building, AlertCircle } from "lucide-react";

import { LoadingState } from "@/components/ui/EmptyState";
type LinkedInOption = {
  id: string;
  urn: string;
  name: string;
  type: "person" | "organization";
  picture?: string;
};

function LinkedInSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to") || "/fleet?success=linkedin-connected";

  const [options, setOptions] = useState<LinkedInOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ options?: LinkedInOption[] }>("/api/auth/linkedin/options")
      .then((data) => setOptions(data.options ?? []))
      .catch((err) => setError(toErrorMessage(err, "Could not load your LinkedIn profiles")))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (urn: string) => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/api/auth/linkedin/save", { urn });
      router.push(returnTo);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save selection"));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <LoadingState label="Loading your LinkedIn profiles and pages…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={() => router.push(returnTo.startsWith("/onboarding") || returnTo.startsWith("/editorial") ? returnTo : "/fleet")}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-line text-ink hover:bg-line"
        >
          {returnTo.startsWith("/onboarding") ? "Return to Onboarding" : returnTo.startsWith("/editorial") ? "Return to Editorial Studio" : "Return to Channels"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-[#0077b5] flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-3xl font-serif">in</span>
        </div>
        <h1 className="text-2xl font-bold text-ink">Select Publishing Target</h1>
        <p className="text-muted">
          Choose whether Minions should broadcast articles to your personal profile or a company page you manage.
        </p>
      </div>

      <div className="grid gap-4">
        {options.map((opt) => (
          <div
            key={opt.urn}
            className="flex items-center justify-between p-4 rounded-xl border border-line bg-canvas hover:border-brand/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center shrink-0 overflow-hidden">
                {opt.picture ? (
                  <img src={opt.picture} alt={opt.name} className="w-full h-full object-cover" />
                ) : opt.type === "person" ? (
                  <User className="w-5 h-5 text-muted" />
                ) : (
                  <Building className="w-5 h-5 text-muted" />
                )}
              </div>
              <div>
                <div className="font-bold text-ink">{opt.name}</div>
                <div className="text-xs text-muted capitalize">{opt.type}</div>
              </div>
            </div>
            <button
              onClick={() => handleSelect(opt.urn)}
              disabled={saving}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-[#0077b5] hover:bg-[#0077b5]/90 text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Connect
            </button>
          </div>
        ))}

        {options.length === 0 && (
          <div className="text-center p-8 text-muted border border-line rounded-xl border-dashed">
            No profiles or pages found.
          </div>
        )}
      </div>
    </div>
  );
}

export default function LinkedInSelectPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl py-8">
          <LoadingState />
        </div>
      }
    >
      <LinkedInSelectContent />
    </Suspense>
  );
}
