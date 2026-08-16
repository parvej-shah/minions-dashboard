"use client";

import { useState } from "react";
import { 
  Palette, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Check, 
  Copy, 
  BookOpen, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Sliders, 
  Layers, 
  Terminal, 
  FileText, 
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  ImageIcon,
  Maximize2,
  ExternalLink,
  Lock,
  Bot,
  Globe,
  Share2,
  Download,
  Filter,
  Search,
  Zap,
  Radio,
  Cpu
} from "lucide-react";
import { BrandDirectiveItem, BrandCategory } from "@/lib/types";
import { INITIAL_BRAND_DIRECTIVES } from "@/lib/api";

const CATEGORIES: { label: string; value: BrandCategory; desc: string }[] = [
  { label: "Identity & Name", value: "IDENTITY", desc: "Core naming rules and company definition" },
  { label: "Forbidden & Banned", value: "FORBIDDEN", desc: "Strictly banned phrases, fake accounts & words" },
  { label: "Allowed Proof", value: "PROOF", desc: "Verifiable technical claims & live demos" },
  { label: "ICP Pain Points", value: "ICP_PAIN", desc: "Real HVAC/Plumbing/Electrical field friction" },
  { label: "Voice DOs", value: "VOICE_DO", desc: "Stripe/Linear cadence & operator examples" },
  { label: "Voice DONTs", value: "VOICE_DONT", desc: "No AI cheerleading or fluff paragraphs" },
  { label: "Peer Stance", value: "PEER_STANCE", desc: "Engineering positions on deterministic systems" },
  { label: "Objections", value: "OBJECTION", desc: "Handling contractor skepticism" },
  { label: "Calls to Action", value: "CTA", desc: "Approved closing actions & test line" }
];

// Mascot Squad Data
interface MascotItem {
  id: string;
  name: string;
  codename: string;
  role: string;
  trade: string;
  model: string;
  description: string;
  avatar_path: string;
  full_asset_path: string;
  status: "ACTIVE" | "STANDBY";
  skills: string[];
}

const MASCOT_SQUAD: MascotItem[] = [
  {
    id: "MASCOT-REX",
    name: "Rex",
    codename: "WORKER-005",
    role: "Lead Emergency Voice Dispatcher",
    trade: "HVAC & Emergency Calls",
    model: "qwen-max (Sub-1.8s Voice)",
    description: "Primary voice AI minion. Handles inbound emergency dispatch calls with sub-1.8s latency, ambient background noise suppression, and structured JSON booking handoffs.",
    avatar_path: "/images/mascots/rex.png",
    full_asset_path: "/images/rex-3d-mascot-hero.png",
    status: "ACTIVE",
    skills: ["<1.8s Voice Response", "Emergency Triage", "Noise Cancellation", "ServiceTitan Booking"]
  },
  {
    id: "MASCOT-GIA",
    name: "Gia",
    codename: "WORKER-OPS",
    role: "Operations & CRM Coordinator",
    trade: "Field Logistics & GHL/CRM",
    model: "qwen3.7-max (Ops Reasoning)",
    description: "The operations brain. Syncs customer service histories, technician skill matrices, and bi-directional CRM updates across GoHighLevel and Housecall Pro.",
    avatar_path: "/images/mascots/gia.png",
    full_asset_path: "/images/gia-mascot.jpg",
    status: "ACTIVE",
    skills: ["CRM Bi-directional Sync", "Job History Auditing", "Skill-Based Routing", "GoHighLevel Engine"]
  },
  {
    id: "MASCOT-OTTO",
    name: "Otto",
    codename: "WORKER-SECURITY",
    role: "Deterministic Safety & Schema Gate",
    trade: "Type Safety & Compliance",
    model: "Compiled Go Binary + qwen3.7-flash",
    description: "The ironclad validator. Enforces 100% JSON schema adherence on every inter-agent payload, redacting PII and rejecting hallucinated fields before database commits.",
    avatar_path: "/images/mascots/otto.png",
    full_asset_path: "/images/otto-security-photo.jpg",
    status: "ACTIVE",
    skills: ["Deterministic Go Validator", "Zero-Hallucination Gate", "PII Redaction", "Token Rate Limiting"]
  },
  {
    id: "MASCOT-PIP",
    name: "Pip",
    codename: "WORKER-006",
    role: "Speed-to-Lead Followup Engager",
    trade: "SMS & Customer Lifecycle",
    model: "qwen-plus (Lifecycle Engine)",
    description: "The speed minion. Re-engages missed calls and web form leads via two-way SMS in under 45 seconds, maximizing conversion rates for emergency contractors.",
    avatar_path: "/images/mascots/pip.png",
    full_asset_path: "/images/mascots/pip.png",
    status: "ACTIVE",
    skills: ["<45s SMS Outreach", "Missed Call Recovery", "Review Collection", "Conversational Re-engagement"]
  },
  {
    id: "MASCOT-ZIP",
    name: "Zip",
    codename: "WORKER-007",
    role: "Route & Territory Logistics Optimizer",
    trade: "Dispatch & Routing",
    model: "qwen-plus (Logistics Engine)",
    description: "The dispatch navigator. Optimizes multi-van drive routes, calculates traffic overhead, and locks firm 2-hour arrival windows to minimize technician windshield time.",
    avatar_path: "/images/mascots/zip.png",
    full_asset_path: "/images/mascots/zip.png",
    status: "ACTIVE",
    skills: ["Drive-Time Optimization", "Van Territory Clustering", "Arrival Window Locks", "Fuel & Labor Savings"]
  }
];

// Social Templates Catalog
interface SocialTemplateItem {
  id: string;
  platform: "LINKEDIN" | "FACEBOOK" | "TWITTER" | "GITHUB" | "YOUTUBE" | "SQUAD";
  type: "COVER" | "AVATAR";
  name: string;
  dimensions: string;
  theme: "DARK" | "TEAL" | "LIGHT" | "MONOGRAM" | "STACKED" | "AI";
  path: string;
  description: string;
}

const SOCIAL_TEMPLATES: SocialTemplateItem[] = [
  // COVERS
  {
    id: "COV-LI-01",
    platform: "LINKEDIN",
    type: "COVER",
    name: "LinkedIn Tactical Dark Studio Cover",
    dimensions: "1584 × 396 px",
    theme: "DARK",
    path: "/images/social-covers/linkedin/linkedin_cover_dark.png",
    description: "Official dark slate theme with stitched leather texture, brand wordmark, and tactical contractor positioning."
  },
  {
    id: "COV-LI-02",
    platform: "LINKEDIN",
    type: "COVER",
    name: "LinkedIn Minions Teal Brand Cover",
    dimensions: "1584 × 396 px",
    theme: "TEAL",
    path: "/images/social-covers/linkedin/linkedin_cover_teal.png",
    description: "Vibrant brand teal gradient with white typography and telemetry line accent."
  },
  {
    id: "COV-FB-01",
    platform: "FACEBOOK",
    type: "COVER",
    name: "Facebook Page Dark Header",
    dimensions: "820 × 312 px",
    theme: "DARK",
    path: "/images/social-covers/facebook/facebook_cover_dark.png",
    description: "Optimized mobile/desktop safe zone layout with primary branding on dark charcoal."
  },
  {
    id: "COV-FB-02",
    platform: "FACEBOOK",
    type: "COVER",
    name: "Facebook Page Teal Header",
    dimensions: "820 × 312 px",
    theme: "TEAL",
    path: "/images/social-covers/facebook/facebook_cover_teal.png",
    description: "High-contrast teal version tailored for local trade contractor community outreach."
  },
  {
    id: "COV-TW-01",
    platform: "TWITTER",
    type: "COVER",
    name: "Twitter / X Dark Header Banner",
    dimensions: "1500 × 500 px",
    theme: "DARK",
    path: "/images/social-covers/twitter/twitter_cover_dark.png",
    description: "High-DPI technical header with deterministic systems engineering callouts."
  },
  {
    id: "COV-TW-02",
    platform: "TWITTER",
    type: "COVER",
    name: "Twitter / X Teal Header Banner",
    dimensions: "1500 × 500 px",
    theme: "TEAL",
    path: "/images/social-covers/twitter/twitter_cover_teal.png",
    description: "Vibrant teal header banner with brand wordmark and responsive spacing."
  },
  {
    id: "COV-GH-01",
    platform: "GITHUB",
    type: "COVER",
    name: "GitHub Organization Social Dark Preview",
    dimensions: "1280 × 640 px",
    theme: "DARK",
    path: "/images/social-covers/github/github_social_dark.png",
    description: "High-contrast OpenGraph card for open-source audio streaming & schema repos."
  },
  {
    id: "COV-GH-02",
    platform: "GITHUB",
    type: "COVER",
    name: "GitHub Organization Social Teal Preview",
    dimensions: "1280 × 640 px",
    theme: "TEAL",
    path: "/images/social-covers/github/github_social_teal.png",
    description: "Teal OpenGraph card designed for rich social sharing cards on GitHub links."
  },
  {
    id: "COV-YT-01",
    platform: "YOUTUBE",
    type: "COVER",
    name: "YouTube Channel 4K Banner (Dark)",
    dimensions: "2560 × 1440 px",
    theme: "DARK",
    path: "/images/social-covers/youtube/youtube_banner_dark.png",
    description: "Ultra-HD channel art formatted for TV, desktop, and mobile viewports."
  },
  {
    id: "COV-YT-02",
    platform: "YOUTUBE",
    type: "COVER",
    name: "YouTube Channel 4K Banner (Teal)",
    dimensions: "2560 × 1440 px",
    theme: "TEAL",
    path: "/images/social-covers/youtube/youtube_banner_teal.png",
    description: "Teal 4K YouTube banner with centered branding in television-safe bounds."
  },
  {
    id: "COV-SQUAD-01",
    platform: "SQUAD",
    type: "COVER",
    name: "Minions Mascot Squad Showcase Hero",
    dimensions: "1200 × 630 px",
    theme: "DARK",
    path: "/images/social-covers/test_squad.png",
    description: "Wide panoramic showcase featuring the complete Minions squad in action."
  },

  // AVATARS
  {
    id: "AV-LI-01",
    platform: "LINKEDIN",
    type: "AVATAR",
    name: "LinkedIn Profile Avatar (Dark)",
    dimensions: "800 × 800 px",
    theme: "DARK",
    path: "/images/social-avatars/linkedin/linkedin_avatar_dark_800x800.png",
    description: "High-contrast circular avatar on dark ink slate."
  },
  {
    id: "AV-LI-02",
    platform: "LINKEDIN",
    type: "AVATAR",
    name: "LinkedIn Profile Avatar (Teal)",
    dimensions: "800 × 800 px",
    theme: "TEAL",
    path: "/images/social-avatars/linkedin/linkedin_avatar_teal_800x800.png",
    description: "Brand teal background avatar with crisp white logo."
  },
  {
    id: "AV-LI-03",
    platform: "LINKEDIN",
    type: "AVATAR",
    name: "LinkedIn Profile Avatar (Light)",
    dimensions: "800 × 800 px",
    theme: "LIGHT",
    path: "/images/social-avatars/linkedin/linkedin_avatar_light_800x800.png",
    description: "Clean cream background avatar for high-contrast light profile headers."
  },
  {
    id: "AV-FB-01",
    platform: "FACEBOOK",
    type: "AVATAR",
    name: "Facebook Profile Avatar (Dark)",
    dimensions: "800 × 800 px",
    theme: "DARK",
    path: "/images/social-avatars/facebook/facebook_avatar_dark_800x800.png",
    description: "Square 800x800 avatar formatted for Facebook circular profile cropping."
  },
  {
    id: "AV-FB-02",
    platform: "FACEBOOK",
    type: "AVATAR",
    name: "Facebook Profile Avatar (Teal)",
    dimensions: "800 × 800 px",
    theme: "TEAL",
    path: "/images/social-avatars/facebook/facebook_avatar_teal_800x800.png",
    description: "Vibrant teal Facebook brand avatar."
  },
  {
    id: "AV-TW-01",
    platform: "TWITTER",
    type: "AVATAR",
    name: "Twitter / X Avatar (Dark Horizontal)",
    dimensions: "800 × 800 px",
    theme: "DARK",
    path: "/images/social-avatars/twitter/twitter_avatar_dark_800x800.png",
    description: "Standard horizontal wordmark on dark background."
  },
  {
    id: "AV-TW-02",
    platform: "TWITTER",
    type: "AVATAR",
    name: "Twitter / X Avatar (Dark Monogram)",
    dimensions: "800 × 800 px",
    theme: "MONOGRAM",
    path: "/images/social-avatars/twitter/twitter_avatar_dark_monogram_800x800.png",
    description: "Monogram M.ai icon mark optimized for small avatar bubbles."
  },
  {
    id: "AV-TW-03",
    platform: "TWITTER",
    type: "AVATAR",
    name: "Twitter / X Avatar (Dark Stacked)",
    dimensions: "800 × 800 px",
    theme: "STACKED",
    path: "/images/social-avatars/twitter/twitter_avatar_dark_stacked_800x800.png",
    description: "Two-line stacked lockup on dark background."
  },
  {
    id: "AV-TW-04",
    platform: "TWITTER",
    type: "AVATAR",
    name: "Twitter / X Avatar (Teal Monogram)",
    dimensions: "800 × 800 px",
    theme: "MONOGRAM",
    path: "/images/social-avatars/twitter/twitter_avatar_teal_monogram_800x800.png",
    description: "Monogram icon mark on teal brand background."
  },
  {
    id: "AV-GH-01",
    platform: "GITHUB",
    type: "AVATAR",
    name: "GitHub Organization Avatar (Dark)",
    dimensions: "800 × 800 px",
    theme: "DARK",
    path: "/images/social-avatars/github/github_avatar_dark_800x800.png",
    description: "Organization profile avatar on dark slate background."
  },
  {
    id: "AV-GH-02",
    platform: "GITHUB",
    type: "AVATAR",
    name: "GitHub Organization Avatar (Dark Stacked)",
    dimensions: "800 × 800 px",
    theme: "STACKED",
    path: "/images/social-avatars/github/github_avatar_dark_stacked_800x800.png",
    description: "Stacked organization logo avatar."
  },
  {
    id: "AV-YT-01",
    platform: "YOUTUBE",
    type: "AVATAR",
    name: "YouTube Channel Avatar (Dark)",
    dimensions: "800 × 800 px",
    theme: "DARK",
    path: "/images/social-avatars/youtube/youtube_avatar_dark_800x800.png",
    description: "High-resolution circular crop avatar for video channel headers."
  },
  {
    id: "AV-YT-02",
    platform: "YOUTUBE",
    type: "AVATAR",
    name: "YouTube Channel Avatar (Teal)",
    dimensions: "800 × 800 px",
    theme: "TEAL",
    path: "/images/social-avatars/youtube/youtube_avatar_teal_800x800.png",
    description: "Teal brand YouTube channel profile picture."
  },
  {
    id: "AV-AI-01",
    platform: "LINKEDIN",
    type: "AVATAR",
    name: "LinkedIn AI Persona Profile Avatar",
    dimensions: "800 × 800 px",
    theme: "AI",
    path: "/images/social-avatars/ai-generated/linkedin_profile_avatar_ai.jpg",
    description: "Photorealistic AI agent portrait for automated executive outreach."
  },
  {
    id: "AV-AI-02",
    platform: "TWITTER",
    type: "AVATAR",
    name: "Twitter / X AI Persona Profile Avatar",
    dimensions: "800 × 800 px",
    theme: "AI",
    path: "/images/social-avatars/ai-generated/twitter_profile_avatar_ai.jpg",
    description: "AI-generated operator portrait for automated tech updates."
  }
];

export default function BrandStudioPage() {
  const [activeTab, setActiveTab] = useState<"visuals" | "mascots" | "social" | "directives" | "multi_brand" | "lexicon">("visuals");
  const [directives, setDirectives] = useState<BrandDirectiveItem[]>(INITIAL_BRAND_DIRECTIVES);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<number | "ALL">("ALL");
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Logo Studio State
  const [logoBgMode, setLogoBgMode] = useState<"dark" | "white" | "teal" | "checker">("dark");
  const [activeLogoVariant, setActiveLogoVariant] = useState<"inverted" | "primary" | "teal">("inverted");
  const [logoSaved, setLogoSaved] = useState(false);

  // Social Template State
  const [socialPlatformFilter, setSocialPlatformFilter] = useState<string>("ALL");
  const [socialTypeFilter, setSocialTypeFilter] = useState<"ALL" | "COVER" | "AVATAR">("ALL");
  const [activePreviewAsset, setActivePreviewAsset] = useState<SocialTemplateItem | null>(null);

  // Mascot Squad State
  const [selectedMascot, setSelectedMascot] = useState<MascotItem | null>(MASCOT_SQUAD[0]);
  const [mascotPreviewModal, setMascotPreviewModal] = useState<MascotItem | null>(null);

  // Cover Reference Templates
  const [coverTemplates, setCoverTemplates] = useState([
    {
      id: "TMPL-01",
      name: "Tactile Studio Leather Flat-Lay",
      description: "Real stitched leather clipboard, dark slate tabletop, volumetric rim lighting, centered minimalist title",
      is_active: true,
      preview_url: "/images/social-covers/linkedin/linkedin_cover_dark.png"
    },
    {
      id: "TMPL-02",
      name: "Minimalist Slate Blueprint",
      description: "Dark carbon texture, architectural grid lines, cyan & teal schematics, high-contrast monochrome typography",
      is_active: false,
      preview_url: "/images/social-covers/github/github_social_dark.png"
    },
    {
      id: "TMPL-03",
      name: "Minions Squad Hero Showcase",
      description: "Full active AI fleet rendered in high-detail 3D isometric studio lighting with telemetry badges",
      is_active: false,
      preview_url: "/images/social-covers/test_squad.png"
    },
    {
      id: "TMPL-04",
      name: "Operator Voice Dispatch Studio",
      description: "Technical audio waveform visualizers, sub-1.8s latency gauges, and deep slate dark mode styling",
      is_active: false,
      preview_url: "/images/social-covers/twitter/twitter_cover_dark.png"
    }
  ]);

  // Brand Colors state
  const [brandColors] = useState({
    primaryInk: "#12242a",
    brandTeal: "#0e5c63",
    brandCoral: "#ff6b4a",
    creamCanvas: "#fff8f0",
    accentBlue: "#3a6ea5"
  });

  // Directives Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState<BrandCategory>("VOICE_DO");
  const [newKey, setNewKey] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<1 | 2 | 3>(1);
  const [newAudience, setNewAudience] = useState<"ALL" | "ICP" | "PEER" | "BRIDGE">("ALL");

  // Multi-brand instruction state
  const [selectedBrand, setSelectedBrand] = useState("getminions.ai");
  const [operatorPrompt, setOperatorPrompt] = useState(
    "Always maintain a technical, tactile tone. Treat the reader as an intelligent trade contractor or software architect who respects physics, concrete numbers, and real error logs. Never speak like a marketer."
  );
  const [promptSaved, setPromptSaved] = useState(false);

  // Banned lexicon list
  const [bannedWords, setBannedWords] = useState([
    "delve", "testament", "tapestry", "seamless", "game-changing", 
    "revolutionize", "unlock", "synergy", "in today's fast-paced world", 
    "the future of", "leverage", "supercharge", "🚀", "💡"
  ]);
  const [newBannedWord, setNewBannedWord] = useState("");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleCoverTemplate = (id: string) => {
    setCoverTemplates(coverTemplates.map(t => ({
      ...t,
      is_active: t.id === id
    })));
  };

  const handleAddDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newContent) return;

    const item: BrandDirectiveItem = {
      id: `DIR-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      category: newCat,
      key: newKey.toLowerCase().replace(/\s+/g, "_"),
      content: newContent,
      priority: newPriority,
      audience_scope: newAudience,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    setDirectives([item, ...directives]);
    setShowAddModal(false);
    setNewKey("");
    setNewContent("");
  };

  const toggleDirective = (id: string) => {
    setDirectives(directives.map(d => d.id === id ? { ...d, is_active: !d.is_active } : d));
  };

  const deleteDirective = (id: string) => {
    setDirectives(directives.filter(d => d.id !== id));
  };

  const handleAddBannedWord = () => {
    if (newBannedWord && !bannedWords.includes(newBannedWord.trim().toLowerCase())) {
      setBannedWords([...bannedWords, newBannedWord.trim().toLowerCase()]);
      setNewBannedWord("");
    }
  };

  const removeBannedWord = (word: string) => {
    setBannedWords(bannedWords.filter(w => w !== word));
  };

  const filteredDirectives = directives.filter(d => {
    if (selectedCategory !== "ALL" && d.category !== selectedCategory) return false;
    if (selectedPriority !== "ALL" && d.priority !== selectedPriority) return false;
    if (selectedAudience !== "ALL" && d.audience_scope !== selectedAudience) return false;
    return true;
  });

  const filteredSocialTemplates = SOCIAL_TEMPLATES.filter(tmpl => {
    if (socialPlatformFilter !== "ALL" && tmpl.platform !== socialPlatformFilter) return false;
    if (socialTypeFilter !== "ALL" && tmpl.type !== socialTypeFilter) return false;
    return true;
  });

  // Current active logo path
  const currentLogoSrc = activeLogoVariant === "inverted"
    ? "/images/minions_ai_logo_inverted_transparent.png"
    : activeLogoVariant === "primary"
    ? "/images/minions_ai_logo_primary_transparent.png"
    : "/images/minions_ai_logo_teal_transparent.png";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Brand Governance & Visual Asset Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Brand Studio & Visual Assets
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Real transparent logos, 3D Mascot Squad, official social avatars & covers, and live LLM prompt directives.
          </p>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex flex-wrap items-center bg-[#0F1419] p-1 rounded-xl border border-[#1F2D3D] self-start md:self-auto gap-1">
          <button
            onClick={() => setActiveTab("visuals")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "visuals"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Visuals & Logo Studio
          </button>
          <button
            onClick={() => setActiveTab("mascots")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "mascots"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Mascot Squad (5)
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "social"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Social Assets ({SOCIAL_TEMPLATES.length})
          </button>
          <button
            onClick={() => setActiveTab("directives")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "directives"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Directives ({directives.length})
          </button>
          <button
            onClick={() => setActiveTab("multi_brand")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "multi_brand"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Instruct Fleet
          </button>
          <button
            onClick={() => setActiveTab("lexicon")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "lexicon"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Banned ({bannedWords.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: VISUALS & LOGO STUDIO */}
      {/* ======================================================== */}
      {activeTab === "visuals" && (
        <div className="space-y-6">
          {/* Main Logo & Vector Management Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Logo Canvas (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#00C9A7]" />
                    <h2 className="text-sm font-bold text-[#F1F5F9]">
                      Official Brand Transparent Logo Wordmarks
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded-full border border-[#00C9A7]/30 font-semibold">
                    Real PNG Alpha Assets
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Real transparent brand logos rendered by the Visual Art Director (<code className="text-[#00C9A7] font-mono">qwen-image-3.0</code>) for cover synthesis, social cards, and PDF technical teardowns.
                </p>

                {/* Variant Switcher Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setActiveLogoVariant("inverted");
                      setLogoBgMode("dark");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeLogoVariant === "inverted"
                        ? "bg-[#161D26] text-[#00C9A7] border border-[#00C9A7] shadow-sm"
                        : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <span>Inverted (White + Coral)</span>
                    <span className="text-[10px] opacity-75">Dark Surfaces</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveLogoVariant("primary");
                      setLogoBgMode("white");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeLogoVariant === "primary"
                        ? "bg-[#161D26] text-[#00C9A7] border border-[#00C9A7] shadow-sm"
                        : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <span>Primary (Dark + Coral)</span>
                    <span className="text-[10px] opacity-75">Light Canvas</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveLogoVariant("teal");
                      setLogoBgMode("dark");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeLogoVariant === "teal"
                        ? "bg-[#161D26] text-[#00C9A7] border border-[#00C9A7] shadow-sm"
                        : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <span>Teal Wordmark</span>
                    <span className="text-[10px] opacity-75">Accent Cards</span>
                  </button>
                </div>

                {/* Live Logo Preview Canvas with Interactive Backgrounds */}
                <div 
                  className={`p-10 rounded-2xl border border-[#1F2D3D] flex items-center justify-center min-h-[180px] shadow-inner relative transition-all group ${
                    logoBgMode === "dark" 
                      ? "bg-[#070B0F]" 
                      : logoBgMode === "white" 
                      ? "bg-white" 
                      : logoBgMode === "teal"
                      ? "bg-[#0E5C63]"
                      : "bg-[#121820] bg-[radial-gradient(#263445_1px,transparent_1px)] [background-size:12px_12px]"
                  }`}
                >
                  <img
                    src={currentLogoSrc}
                    alt="Minions.AI Brand Logo"
                    className="max-h-16 max-w-[320px] object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Actions overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(currentLogoSrc, "logo-path")}
                      className="p-2 rounded-xl bg-[#0F1419]/90 backdrop-blur-md text-[#94A3B8] hover:text-[#00C9A7] border border-[#1F2D3D] shadow-lg transition-all"
                      title="Copy asset path"
                    >
                      {copiedKey === "logo-path" ? (
                        <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={currentLogoSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0F1419]/90 backdrop-blur-md text-[#94A3B8] hover:text-white border border-[#1F2D3D] shadow-lg transition-all"
                      title="Open full-resolution asset"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Canvas Background Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#64748B]">Preview Background:</span>
                    <button
                      onClick={() => setLogoBgMode("dark")}
                      className={`w-6 h-6 rounded-lg bg-[#070B0F] border ${logoBgMode === "dark" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                      title="Dark Slate #070B0F"
                    />
                    <button
                      onClick={() => setLogoBgMode("white")}
                      className={`w-6 h-6 rounded-lg bg-white border ${logoBgMode === "white" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                      title="Clean White #FFFFFF"
                    />
                    <button
                      onClick={() => setLogoBgMode("teal")}
                      className={`w-6 h-6 rounded-lg bg-[#0E5C63] border ${logoBgMode === "teal" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                      title="Brand Teal #0E5C63"
                    />
                    <button
                      onClick={() => setLogoBgMode("checker")}
                      className={`w-6 h-6 rounded-lg bg-[#121820] border ${logoBgMode === "checker" ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/30" : "border-[#1F2D3D]"}`}
                      title="Transparency Grid"
                    />
                  </div>

                  <div className="text-[11px] font-mono text-[#00C9A7] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
                    <span>{currentLogoSrc}</span>
                  </div>
                </div>
              </div>

              {/* Logo Path & Copy Bar */}
              <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono uppercase bg-[#00C9A7]/10 text-[#00C9A7] px-2 py-0.5 rounded border border-[#00C9A7]/20 font-bold">
                    Active Asset
                  </span>
                  <code className="text-[#F1F5F9] font-mono text-[11px] truncate">
                    {currentLogoSrc}
                  </code>
                </div>

                <button
                  onClick={() => copyToClipboard(currentLogoSrc, "bar-path")}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#94A3B8] hover:text-[#00C9A7] shrink-0 font-semibold"
                >
                  {copiedKey === "bar-path" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Path</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Favicon & Vector Tokens (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                    App Favicon & Multi-Scale Assets
                  </h3>
                  <span className="text-[10px] font-mono text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full border border-[#3B82F6]/30 font-semibold">
                    Vector SVG Active
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Multi-resolution browser tab icon and PWA touch asset served at <code className="text-[#3B82F6] font-mono">/icon.svg</code> with vector scaling.
                </p>

                {/* Multi-Size Favicon Previews */}
                <div className="p-6 rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-around shadow-inner">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md group hover:border-[#00C9A7] transition-all">
                      <img src="/icon.svg" alt="64x64" className="w-12 h-12 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">64×64 (Hi-DPI)</div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md group hover:border-[#00C9A7] transition-all">
                      <img src="/icon.svg" alt="32x32" className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">32×32 (Desktop)</div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center mx-auto shadow-md group hover:border-[#00C9A7] transition-all">
                      <img src="/icon.svg" alt="16x16" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">16×16 (Tab)</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs text-[#94A3B8] flex items-center justify-between">
                  <span>Source File: <code className="text-[#F1F5F9] font-mono">public/icon.svg</code></span>
                  <span className="text-[#00C9A7] font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Synchronized
                  </span>
                </div>
              </div>

              {/* Quick Mascot Teaser Banner */}
              <div 
                onClick={() => setActiveTab("mascots")}
                className="p-4 rounded-xl bg-gradient-to-r from-[#0E5C63]/30 via-[#161D26] to-[#0F1419] border border-[#00C9A7]/30 hover:border-[#00C9A7] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-[#00C9A7]/40 shrink-0">
                    <img src="/images/mascots/rex.png" alt="Rex" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors">
                      Mascot Squad Available (5 Minions)
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">
                      Rex, Gia, Otto, Pip & Zip active
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#00C9A7] font-bold">Inspect →</span>
              </div>
            </div>
          </div>

          {/* Cover Style Reference Templates (AI Ingestion) */}
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ff6b4a]" />
                  AI Editorial Cover Style Reference Templates
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Visual style references injected into the Qwen Image 3.0 prompt for editorial cover synthesis.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded border border-[#00C9A7]/30">
                Working 2K Assets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coverTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => toggleCoverTemplate(tmpl.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 group ${
                    tmpl.is_active
                      ? "bg-[#161D26] border-[#00C9A7] shadow-lg shadow-[#00C9A7]/10"
                      : "bg-[#0F1419] border-[#1F2D3D] hover:border-[#2A3D52]"
                  }`}
                >
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black shrink-0 border border-[#1F2D3D]">
                    <img 
                      src={tmpl.preview_url} 
                      alt={tmpl.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F1F5F9] line-clamp-1">{tmpl.name}</span>
                      {tmpl.is_active ? (
                        <span className="text-[10px] font-mono text-[#00C9A7] font-bold shrink-0">● Active</span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#64748B] shrink-0">Select</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1F2D3D] text-[10px] font-mono text-[#64748B]">
                    <span>{tmpl.id}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(tmpl.preview_url, tmpl.id);
                      }}
                      className="text-[#94A3B8] hover:text-[#00C9A7]"
                    >
                      {copiedKey === tmpl.id ? "Copied!" : "Copy Path"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Brand Color Tokens */}
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#00C9A7]" />
                Official Brand Color Palette Tokens
              </h3>
              <span className="text-xs font-mono text-[#94A3B8]">Minions Design System Tokens</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#12242a] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Deep Slate Ink</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#12242a</code>
                </div>
                <div className="text-[10px] text-[#64748B]">Primary Dark Background</div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#0e5c63] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Brand Teal</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#0e5c63</code>
                </div>
                <div className="text-[10px] text-[#64748B]">Primary Brand Accent</div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#ff6b4a] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Vibrant Coral</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#ff6b4a</code>
                </div>
                <div className="text-[10px] text-[#64748B]">.ai Domain Dot & CTAs</div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#fff8f0] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#12242a] bg-white px-1.5 py-0.5 rounded">Cream Canvas</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#fff8f0</code>
                </div>
                <div className="text-[10px] text-[#64748B]">Light Contrast Surfaces</div>
              </div>

              <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
                <div className="h-12 rounded-lg bg-[#3a6ea5] border border-[#1F2D3D] shadow-inner" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F1F5F9]">Electric Blue</span>
                  <code className="text-[#00C9A7] font-mono text-[11px]">#3a6ea5</code>
                </div>
                <div className="text-[10px] text-[#64748B]">Telemetry & Benchmarks</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: THE MASCOT SQUAD SHOWCASE */}
      {/* ======================================================== */}
      {activeTab === "mascots" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#00C9A7]" />
                <h2 className="text-base font-bold text-[#F1F5F9]">
                  The Minions Mascot Squad (5 Active Field AI Minions)
                </h2>
              </div>
              <span className="text-xs font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2.5 py-1 rounded-full border border-[#00C9A7]/30 font-semibold">
                ● 5 Autonomous Workers Provisioned
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] max-w-3xl">
              Each Minion represents an active autonomous subsystem inside getminions.ai, from sub-1.8s voice intake (Rex) to deterministic schema validation (Otto) and rapid speed-to-lead nurturing (Pip).
            </p>
          </div>

          {/* 5 Mascot Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MASCOT_SQUAD.map((mascot) => (
              <div
                key={mascot.id}
                className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/60 transition-all flex flex-col justify-between space-y-4 shadow-sm group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Avatar Preview Frame */}
                  <div className="relative aspect-square rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center p-4 overflow-hidden group-hover:border-[#00C9A7]/40 transition-colors">
                    <img
                      src={mascot.avatar_path}
                      alt={mascot.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#00C9A7]/30">
                      <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
                      <span className="text-[10px] font-mono text-[#00C9A7] font-semibold">Active Minion</span>
                    </div>

                    {/* Codename Badge */}
                    <div className="absolute bottom-3 left-3 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#1F2D3D] text-[10px] font-mono text-[#94A3B8]">
                      {mascot.codename}
                    </div>

                    {/* Open High-Res Button */}
                    <a
                      href={mascot.avatar_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 left-3 p-1.5 rounded-lg bg-[#161D26]/90 backdrop-blur-md text-[#94A3B8] hover:text-white border border-[#1F2D3D] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Open full avatar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Info Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors">
                        {mascot.name}
                      </h3>
                      <span className="text-[11px] font-mono text-[#ff6b4a] font-semibold bg-[#ff6b4a]/10 px-2 py-0.5 rounded border border-[#ff6b4a]/20">
                        {mascot.trade}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#3B82F6] mt-0.5 font-mono">
                      {mascot.role}
                    </div>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {mascot.description}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mascot.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-mono bg-[#161D26] text-[#94A3B8] px-2 py-0.5 rounded border border-[#1F2D3D]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[#1F2D3D] flex items-center justify-between">
                  <div className="text-[10px] font-mono text-[#64748B] truncate max-w-[170px]">
                    {mascot.avatar_path}
                  </div>

                  <button
                    onClick={() => copyToClipboard(mascot.avatar_path, mascot.id)}
                    className="flex items-center gap-1 text-xs font-bold text-[#00C9A7] hover:text-[#00A88A] bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 px-2.5 py-1 rounded-lg border border-[#00C9A7]/30 transition-all"
                  >
                    {copiedKey === mascot.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Asset</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SOCIAL AVATARS & COVERS SELECTOR */}
      {/* ======================================================== */}
      {activeTab === "social" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F1419] p-4 rounded-2xl border border-[#1F2D3D]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Platform Selector */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span className="text-xs font-mono text-[#94A3B8]">Platform:</span>
                <select
                  value={socialPlatformFilter}
                  onChange={(e) => setSocialPlatformFilter(e.target.value)}
                  className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                >
                  <option value="ALL">All Social Networks ({SOCIAL_TEMPLATES.length})</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="TWITTER">Twitter / X</option>
                  <option value="GITHUB">GitHub</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="SQUAD">Mascot Squad Banners</option>
                </select>
              </div>

              {/* Type Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-[#94A3B8]">Type:</span>
                <select
                  value={socialTypeFilter}
                  onChange={(e) => setSocialTypeFilter(e.target.value as any)}
                  className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                >
                  <option value="ALL">All Asset Formats</option>
                  <option value="COVER">Social Covers & Headers</option>
                  <option value="AVATAR">Profile Avatars (800×800)</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-mono text-[#00C9A7]">
              Showing {filteredSocialTemplates.length} real assets
            </div>
          </div>

          {/* Social Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSocialTemplates.map((template) => {
              const isCover = template.type === "COVER";

              return (
                <div
                  key={template.id}
                  className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/50 transition-all flex flex-col justify-between space-y-3 shadow-sm group"
                >
                  <div className="space-y-3">
                    {/* Image Preview Container */}
                    <div 
                      className={`relative rounded-xl overflow-hidden bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center ${
                        isCover ? "aspect-[16/7]" : "aspect-square max-h-56 mx-auto w-full"
                      }`}
                    >
                      <img
                        src={template.path}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Platform Badge */}
                      <div className="absolute top-2.5 left-2.5 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#1F2D3D] text-[10px] font-mono text-[#00C9A7] font-bold">
                        {template.platform}
                      </div>

                      {/* Resolution Badge */}
                      <div className="absolute bottom-2.5 right-2.5 bg-[#0F1419]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#1F2D3D] text-[10px] font-mono text-[#94A3B8]">
                        {template.dimensions}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors line-clamp-1">
                          {template.name}
                        </h4>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          template.theme === "DARK" 
                            ? "bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]" 
                            : template.theme === "TEAL"
                            ? "bg-[#0E5C63]/30 text-[#00C9A7] border border-[#0E5C63]"
                            : template.theme === "LIGHT"
                            ? "bg-white/10 text-white border border-white/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {template.theme}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#1F2D3D] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#64748B] truncate max-w-[160px]">
                      {template.path}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(template.path, template.id)}
                        className="p-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-[#94A3B8] hover:text-[#00C9A7] transition-all"
                        title="Copy Asset Path"
                      >
                        {copiedKey === template.id ? (
                          <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={template.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-[#94A3B8] hover:text-white transition-all"
                        title="Open Full Asset"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DIRECTIVES TABLE */}
      {/* ======================================================== */}
      {activeTab === "directives" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F1419] p-4 rounded-2xl border border-[#1F2D3D]">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
              >
                <option value="ALL">All Categories ({directives.length})</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <select
                value={String(selectedPriority)}
                onChange={(e) => setSelectedPriority(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
              >
                <option value="ALL">All Priorities</option>
                <option value="1">Priority 1 (Always Loaded)</option>
                <option value="2">Priority 2 (Category Relevant)</option>
                <option value="3">Priority 3 (Contextual)</option>
              </select>

              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
              >
                <option value="ALL">All Audience Scopes</option>
                <option value="ICP">ICP (Home Service Contractors)</option>
                <option value="PEER">PEER (Systems & AI Engineers)</option>
                <option value="BRIDGE">BRIDGE (Cross-Disciplinary)</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Brand Directive
            </button>
          </div>

          {/* Add Directive Modal */}
          {showAddModal && (
            <div className="bg-[#0F1419] p-6 rounded-2xl border border-[#00C9A7]/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3">
                <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00C9A7]" />
                  New Brand Directive
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleAddDirective} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Category</label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value as BrandCategory)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Key (Slug)</label>
                    <input
                      type="text"
                      placeholder="e.g. attic_thermal_leak"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      required
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(Number(e.target.value) as 1 | 2 | 3)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    >
                      <option value={1}>1 (Always Loaded into Prompts)</option>
                      <option value={2}>2 (Loaded for Matching Category)</option>
                      <option value={3}>3 (Contextual / Edge Case)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Audience Scope</label>
                    <select
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value as any)}
                      className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9]"
                    >
                      <option value="ALL">ALL (Every Audience)</option>
                      <option value="ICP">ICP (Contractors & Operators)</option>
                      <option value="PEER">PEER (Systems & AI Engineers)</option>
                      <option value="BRIDGE">BRIDGE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Content (Instruction or Example)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter the concrete brand instruction, rule, or example..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl p-3 text-xs text-[#F1F5F9] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:bg-[#161D26]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] font-bold rounded-xl text-xs shadow-sm"
                  >
                    Save Directive
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directives Cards */}
          <div className="grid grid-cols-1 gap-3">
            {filteredDirectives.map((directive) => {
              const isForbidden = directive.category === "FORBIDDEN";
              const isProof = directive.category === "PROOF";
              const isVoice = directive.category === "VOICE_DO" || directive.category === "VOICE_DONT";

              return (
                <div
                  key={directive.id}
                  className={`p-4 rounded-xl border transition-all ${
                    directive.is_active 
                      ? isForbidden 
                        ? "bg-red-500/5 border-red-500/30" 
                        : isProof
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : isVoice
                            ? "bg-cyan-500/5 border-cyan-500/30"
                            : "bg-[#0F1419] border-[#1F2D3D] hover:border-[#00C9A7]/40"
                      : "bg-[#0F1419]/40 border-[#1F2D3D]/30 opacity-50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isForbidden 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : isProof
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : isVoice
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30"
                      }`}>
                        {directive.category}
                      </span>

                      <span className="text-xs font-mono font-semibold text-[#F1F5F9]">
                        {directive.key}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                        Priority {directive.priority}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                        Scope: {directive.audience_scope}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => toggleDirective(directive.id)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded transition-all ${
                          directive.is_active
                            ? "text-[#00C9A7] hover:bg-[#00C9A7]/10"
                            : "text-[#64748B] hover:bg-[#161D26]"
                        }`}
                      >
                        {directive.is_active ? "● Active" : "○ Disabled"}
                      </button>

                      <button
                        onClick={() => copyToClipboard(directive.content, directive.id)}
                        className="text-[#94A3B8] hover:text-[#F1F5F9] p-1"
                        title="Copy content"
                      >
                        {copiedKey === directive.id ? (
                          <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => deleteDirective(directive.id)}
                        className="text-[#94A3B8] hover:text-red-400 p-1"
                        title="Delete directive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed font-sans mt-2 bg-[#070B0F]/60 p-3 rounded-lg border border-[#1F2D3D]">
                    {directive.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: INSTRUCT AGENTS / MULTI-BRAND INSTRUCTION */}
      {/* ======================================================== */}
      {activeTab === "multi_brand" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#00C9A7]" />
                    Direct Brand & Mission Dispatcher
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Write high-priority operator instructions injected into all autonomous agent reasoning prompts.
                  </p>
                </div>

                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] font-medium"
                >
                  <option value="getminions.ai">getminions.ai (Primary Ops)</option>
                  <option value="minions_voice_demo">Minions Voice AI Demo</option>
                  <option value="minions_enterprise">Minions Enterprise Field Ops</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#F1F5F9] flex items-center justify-between">
                  <span>Operator System Directive</span>
                  <span className="text-[11px] font-mono text-[#00C9A7]">Injected before Stage 1 Reasoning</span>
                </label>
                <textarea
                  rows={6}
                  value={operatorPrompt}
                  onChange={(e) => {
                    setOperatorPrompt(e.target.value);
                    setPromptSaved(false);
                  }}
                  className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl p-4 text-xs font-mono text-[#F1F5F9] leading-relaxed focus:outline-none focus:border-[#00C9A7] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#94A3B8] flex items-center gap-2">
                  {promptSaved ? (
                    <span className="text-[#00C9A7] flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Synchronized to all 7 agent workers!
                    </span>
                  ) : (
                    <span>Click save to broadcast new directives to the active agent fleet</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setPromptSaved(true);
                    setTimeout(() => setPromptSaved(false), 3000);
                  }}
                  className="bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Save & Broadcast to Fleet
                </button>
              </div>
            </div>

            {/* Injected Context Preview */}
            <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
              <h4 className="text-xs font-mono font-bold text-[#94A3B8] uppercase flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#00C9A7]" />
                Live Agent Ingestion Preview (What the LLM Sees)
              </h4>
              <pre className="bg-[#070B0F] p-4 rounded-xl text-[11px] font-mono text-[#00C9A7] overflow-x-auto leading-relaxed border border-[#1F2D3D]">
{`=== BRAND CONTEXT INJECTION [${selectedBrand.toUpperCase()}] ===
Company Name: getminions.ai (lowercase, .ai suffix)
Positioning: AI operations partner for US home-services businesses (1-10 techs)
Primary Logo URL: "${currentLogoSrc}"
Tone: Technical, tactile operator prose. 1-3 sentences per paragraph.
Operator Directive: "${operatorPrompt}"
Forbidden Words: [${bannedWords.slice(0, 8).join(", ")}...]
Allowed Proof: Live callable demo number, RAG chatbot, deterministic Go schema.`}
              </pre>
            </div>
          </div>

          {/* Right sidebar: Persona Lanes */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-[#F1F5F9] uppercase font-mono tracking-wider">
                Audience Persona Lanes
              </h3>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#3B82F6]/30">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3B82F6] mb-1">
                    <span>ICP: Operators</span>
                    <span className="text-[10px] font-mono bg-[#3B82F6]/10 px-1.5 py-0.5 rounded">Primary</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-snug">
                    US home service contractors (HVAC, plumbing, electrical) with 1–10 vans. Motivated by speed-to-lead, technician overtime reduction, and zero warranty callbacks.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161D26] border border-[#8B5CF6]/30">
                  <div className="flex items-center justify-between text-xs font-bold text-[#8B5CF6] mb-1">
                    <span>PEER: Systems Engineers</span>
                    <span className="text-[10px] font-mono bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">Technical</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-snug">
                    CTOs, AI architects, and multi-agent system developers. Motivated by deterministic schema validation, sub-1.8s audio latency, and production reliability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: BANNED LEXICON & COMPLIANCE */}
      {/* ======================================================== */}
      {activeTab === "lexicon" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Banned Lexicon & AI Cliché Blacklist
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  The Lead Editorial Reviewer rejects or auto-edits any draft containing these words.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add banned buzzword..."
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBannedWord()}
                  className="bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                />
                <button
                  onClick={handleAddBannedWord}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  + Ban Word
                </button>
              </div>
            </div>

            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-2 pt-2">
              {bannedWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono px-3 py-1.5 rounded-xl"
                >
                  <span>"{word}"</span>
                  <button
                    onClick={() => removeBannedWord(word)}
                    className="text-red-400 hover:text-red-200 transition-colors ml-1"
                    title="Remove from blacklist"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
