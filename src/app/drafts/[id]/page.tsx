"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Share2, 
  Send, 
  Eye, 
  Edit3, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  FileText, 
  DollarSign, 
  Copy, 
  Check, 
  MessageSquare,
  Maximize2,
  ChevronRight,
  Globe
} from "lucide-react";
import { AssetItem, ClaimCheckItem, SocialVariantItem } from "@/lib/types";
import { INITIAL_ASSETS } from "@/lib/api";

export default function DraftReviewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const draftId = resolvedParams.id;

  const [asset, setAsset] = useState<AssetItem>(() => {
    return INITIAL_ASSETS.find(a => a.id === draftId || a.slug === draftId) || INITIAL_ASSETS[0];
  });
  
  const [activeTab, setActiveTab] = useState<"editor" | "claims" | "social" | "cover">("editor");
  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "split">("split");
  const [editedBody, setEditedBody] = useState(asset.body_content);
  const [editedTitle, setEditedTitle] = useState(asset.title);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Synchronize state if draftId matches another item
  useEffect(() => {
    const found = INITIAL_ASSETS.find(a => a.id === draftId || a.slug === draftId);
    if (found) {
      setAsset(found);
      setEditedBody(found.body_content);
      setEditedTitle(found.title);
    }
  }, [draftId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleClaimStatus = (claimId: string) => {
    if (!asset.claim_checks) return;
    const updated = asset.claim_checks.map(c => {
      if (c.id === claimId) {
        const nextStatus: "Y" | "N" | "NA" = c.verified === "Y" ? "N" : "Y";
        return { ...c, verified: nextStatus };
      }
      return c;
    });
    setAsset({ ...asset, claim_checks: updated });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishSuccess(true);
      setAsset(prev => ({
        ...prev,
        status: "PUBLISHED",
        blog_url: `https://getminions.ai/blog/${prev.slug}`,
        published_at: new Date().toISOString()
      }));
    }, 1200);
  };

  // Word count and reading time calculation
  const wordCount = editedBody.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.ceil(wordCount / 225);

  const claimsPassCount = asset.claim_checks?.filter(c => c.verified === "Y").length || 0;
  const totalClaims = asset.claim_checks?.length || 0;
  const allClaimsPassed = totalClaims > 0 && claimsPassCount === totalClaims;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/drafts"
            className="p-2 rounded-xl bg-card/60 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>EDITORIAL STUDIO</span>
              <span>/</span>
              <span className="text-primary font-bold">{asset.id}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                v{asset.version}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground line-clamp-1 mt-0.5">
              {editedTitle}
            </h1>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center gap-2.5">
          {asset.status === "PUBLISHED" ? (
            <a
              href={asset.blog_url || `https://getminions.ai/blog/${asset.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              View Live Blog Post
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Broadcasting Post...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  1-Click Approve & Publish
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {publishSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-emerald-300">Post Successfully Published Live!</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Staged content, cover image, and metadata were synced to Supabase and published at getminions.ai/blog.
              </div>
            </div>
          </div>
          <a
            href={asset.blog_url || `https://getminions.ai/blog/${asset.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-emerald-400 hover:underline shrink-0"
          >
            Open Live ↗
          </a>
        </div>
      )}

      {/* Meta Telemetry & Stage Indicator Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card/40 p-3.5 rounded-2xl border border-border/30">
        <div className="flex items-center gap-2.5 px-3 py-1">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Word Count</div>
            <div className="text-xs font-bold text-foreground">{wordCount} words</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1 border-l border-border/20">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Reading Time</div>
            <div className="text-xs font-bold text-foreground">~{readingTimeMinutes} min read</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1 border-l border-border/20">
          <ShieldCheck className={`w-4 h-4 shrink-0 ${allClaimsPassed ? "text-emerald-400" : "text-amber-400"}`} />
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Claims Gate</div>
            <div className={`text-xs font-bold ${allClaimsPassed ? "text-emerald-400" : "text-amber-400"}`}>
              {claimsPassCount}/{totalClaims} Verified
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1 border-l border-border/20">
          <DollarSign className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Synthesis Cost</div>
            <div className="text-xs font-bold text-foreground">${asset.generation_cost || "0.0386"}</div>
          </div>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "editor"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Article Markdown
          </button>

          <button
            onClick={() => setActiveTab("claims")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "claims"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Claims Verification ({claimsPassCount}/{totalClaims})
          </button>

          <button
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "social"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Social Variants ({asset.social_variants?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("cover")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "cover"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            2K Cover Card
          </button>
        </div>

        {activeTab === "editor" && (
          <div className="flex items-center bg-card/60 p-1 rounded-lg border border-border/40 text-xs mb-1">
            <button
              onClick={() => setEditorMode("edit")}
              className={`px-2.5 py-1 rounded font-medium ${editorMode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Raw Edit
            </button>
            <button
              onClick={() => setEditorMode("split")}
              className={`px-2.5 py-1 rounded font-medium ${editorMode === "split" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Split View
            </button>
            <button
              onClick={() => setEditorMode("preview")}
              className={`px-2.5 py-1 rounded font-medium ${editorMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Preview
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ARTICLE EDITOR & SPLIT VIEW */}
      {activeTab === "editor" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">H1 Article Headline</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className={`grid gap-6 ${editorMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {/* Left: Raw Markdown Editor */}
            {(editorMode === "edit" || editorMode === "split") && (
              <div className="bg-card/70 rounded-2xl border border-border/40 p-4 flex flex-col h-[650px]">
                <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-3">
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    Markdown Source (Stripe/Linear Cadence)
                  </span>
                  <button
                    onClick={() => copyToClipboard(editedBody, "body")}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {copiedKey === "body" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="flex-1 w-full bg-background/50 border-0 p-3 text-xs font-mono text-foreground leading-relaxed focus:outline-none resize-none overflow-y-auto"
                />
              </div>
            )}

            {/* Right: Rendered Typography Preview */}
            {(editorMode === "preview" || editorMode === "split") && (
              <div className="bg-background/80 rounded-2xl border border-border/40 p-6 flex flex-col h-[650px] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-4">
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    Live Prose Rendering (#faf9f6 Reading Canvas)
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">780px Prose Lane</span>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-foreground/90 space-y-4">
                  {editedBody.split("\n\n").map((paragraph, index) => {
                    if (paragraph.startsWith("## ")) {
                      return (
                        <h2 key={index} className="text-lg font-bold text-foreground border-b border-border/30 pb-1 mt-6">
                          {paragraph.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith("### ")) {
                      return (
                        <h3 key={index} className="text-sm font-bold text-primary mt-4">
                          {paragraph.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith("```")) {
                      return (
                        <pre key={index} className="bg-black/60 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-border/30 my-4">
                          {paragraph.replace(/```(json|bash|go)?/g, "")}
                        </pre>
                      );
                    }
                    return (
                      <p key={index} className="text-xs text-foreground/80 leading-relaxed font-sans">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS VERIFICATION GATE */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          <div className="bg-card/70 p-5 rounded-2xl border border-border/40 space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Safety-Critical Claims Checklist Gate
            </h3>
            <p className="text-xs text-muted-foreground">
              Every numeric claim, performance benchmark, and technical assertion is parsed by the Lead Editorial Reviewer. Toggle verification status below or add citation sources.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {asset.claim_checks?.map((claim) => (
              <div
                key={claim.id}
                className={`p-4 rounded-xl border transition-all ${
                  claim.verified === "Y"
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-amber-500/5 border-amber-500/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        claim.verified === "Y"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {claim.source_type}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{claim.id}</span>
                      {claim.confidence_score && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Confidence: {Math.round(claim.confidence_score * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground">{claim.claim_text}</p>
                    {claim.notes && (
                      <p className="text-[11px] text-muted-foreground italic">Note: {claim.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleClaimStatus(claim.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        claim.verified === "Y"
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {claim.verified === "Y" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Flagged / Needs Proof
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL VARIANTS & PLATFORM PREVIEWS */}
      {activeTab === "social" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {asset.social_variants?.map((variant) => {
            const isLinkedIn = variant.platform === "LINKEDIN";
            const isFacebook = variant.platform === "FACEBOOK";
            const isTwitter = variant.platform === "TWITTER";

            return (
              <div key={variant.id} className="bg-card/70 p-5 rounded-2xl border border-border/40 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">{variant.platform} Variant</span>
                    </div>
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {variant.status}
                    </span>
                  </div>

                  <div className="bg-background/60 p-3.5 rounded-xl border border-border/30 text-xs text-foreground/90 font-sans leading-relaxed whitespace-pre-wrap">
                    {variant.content}
                  </div>

                  {variant.first_comment && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                      <div className="text-[10px] font-mono text-primary font-bold uppercase flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        First Comment (Link Anchor)
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{variant.first_comment}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {variant.content.length} chars
                  </span>
                  <button
                    onClick={() => copyToClipboard(variant.content, variant.id)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedKey === variant.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy Post Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: 2K COVER CARD */}
      {activeTab === "cover" && (
        <div className="space-y-6">
          <div className="bg-card/70 p-6 rounded-2xl border border-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Staged 16:9 Studio Cover Card
                </h3>
                <p className="text-xs text-muted-foreground">
                  Synthesized via Qwen Image 3.0 following the tactile leather clipboard flat-lay formula.
                </p>
              </div>

              {asset.hero_image_url && (
                <a
                  href={asset.hero_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View 2K Source on R2
                </a>
              )}
            </div>

            {asset.hero_image_url && (
              <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl aspect-[16/9] max-w-3xl mx-auto bg-black">
                <img
                  src={asset.hero_image_url}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
