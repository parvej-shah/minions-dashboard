/**
 * Static Brand Studio catalogues: directive categories, the mascot squad, and
 * the downloadable social cover/avatar templates.
 *
 * These were ~370 lines of literals sitting at the top of the Brand page.
 */
import type { BrandCategory, MascotItem, SocialTemplateItem } from "@/types";

export const CATEGORIES: { label: string; value: BrandCategory; desc: string }[] = [
  { label: "Identity & Name", value: "IDENTITY", desc: "Core naming rules and company definition" },
  { label: "Editorial Philosophy", value: "EDITORIAL_PHILOSOPHY", desc: "Guiding content beliefs and second-order analytical angle" },
  { label: "Content Themes", value: "CONTENT_THEMES", desc: "Core topic pillars and focus areas" },
  { label: "Audience Lanes", value: "AUDIENCE_LANES", desc: "Target personas (builders, operators, executives)" },
  { label: "Voice DOs", value: "VOICE_DO", desc: "Style, rhythm, and cadence rules" },
  { label: "Voice DONTs", value: "VOICE_DONT", desc: "No marketing fluff or vague claims" },
  { label: "Forbidden & Banned", value: "FORBIDDEN", desc: "Strictly banned phrases and buzzwords" },
  { label: "Allowed Proof", value: "PROOF", desc: "Verifiable technical claims & benchmarks" },
  { label: "ICP Pain Points", value: "ICP_PAIN", desc: "Real day-to-day friction and field problems" },
  { label: "Writing Style", value: "WRITING_STYLE", desc: "Formatting, sentence structure, and vocabulary" },
  { label: "Peer Stance", value: "PEER_STANCE", desc: "Industry opinions & contrarian perspectives" },
  { label: "Objections", value: "OBJECTION", desc: "Handling customer skepticism and objections" },
  { label: "Calls to Action", value: "CTA", desc: "Approved closing actions and next steps" },
];

// Mascot Squad Data
export const MASCOT_SQUAD: MascotItem[] = [
  {
    id: "MASCOT-REX",
    name: "Rex",
    codename: "WORKER-005",
    role: "Lead Emergency Voice Dispatcher",
    trade: "HVAC & Emergency Calls",
    model: "AI Core (Sub-1.8s Voice)",
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
    model: "AI Core (Ops Reasoning)",
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
    model: "Compiled Go Binary + AI Validation",
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
    model: "AI Core (Lifecycle Engine)",
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
    model: "AI Core (Logistics Engine)",
    description: "The dispatch navigator. Optimizes multi-van drive routes, calculates traffic overhead, and locks firm 2-hour arrival windows to minimize technician windshield time.",
    avatar_path: "/images/mascots/zip.png",
    full_asset_path: "/images/mascots/zip.png",
    status: "ACTIVE",
    skills: ["Drive-Time Optimization", "Van Territory Clustering", "Arrival Window Locks", "Fuel & Labor Savings"]
  }
];

// Social Templates Catalog
export const SOCIAL_TEMPLATES: SocialTemplateItem[] = [
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
