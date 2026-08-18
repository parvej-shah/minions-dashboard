# Changelog

All notable changes to the Minions content pipeline (n8n workflows: `01_idea_harvester`,
`02_idea_to_asset`, `03_review_publisher`) and the Cockpit dashboard are logged here.

## 2026-08-18 (every article ended with a rigid, identical "Rule 1/2/3" closer)

### Fixed
- **`02_idea_to_asset`: the writer prompt (`Build Writer Payload`) forced exactly 3
  closing takeaways on every single article, each literally prefixed "Rule 1:",
  "Rule 2:", "Rule 3:"**, regardless of how many actions the argument actually
  supported. Both live posts ended with an identical structure, which reads as a
  templated listicle rather than the Stripe/Linear-grade editorial voice the pipeline
  is going for. Beat 5 now asks for 2-4 takeaways (whatever the argument earns, never
  a forced quota), each opening with a short bolded action phrase specific to that
  point instead of a repeated generic label.
- **`minions-ai`: `components/blog/ArticleContent.tsx`'s takeaway-callout renderer only
  recognized the literal "Rule N:" prefix.** Extended it to also detect the new
  "**Action lead:** sentence" pattern (any count) while keeping the old "Rule N:"
  detection so the 2 already-published posts still render correctly.

## 2026-08-18 (blog post title tags, canonical URLs, social share images, and headline quality)

### Fixed
- **`minions-ai` (public blog): every post `<title>` rendered doubled — "X | Minions.AI |
  Minions.AI".** `app/blog/[slug]/page.tsx` set `title: \`${post.title} | Minions.AI\`` on
  top of the root layout's own `template: "%s | Minions.AI"`, so Next.js applied the
  suffix twice. Now returns the bare `post.title` and lets the layout template apply once.
- **No canonical URL on blog posts.** Added `alternates.canonical` pointing at the live
  post URL in `generateMetadata`.
- **Social shares of every post used the site-wide default image (a roofing photo),
  never the article's actual hero image.** `BlogPost.og_image` / `featured_image` were
  already populated (derived from the hero image embedded in the post content) but never
  wired into `openGraph.images` / `twitter.images`. Now they are, with a fallback chain
  (`og_image` → `featured_image`).
- **`02_idea_to_asset`: generated article titles read like internal engineering tickets,
  not headlines a human would click** (e.g. "Voice AI State Management vs Transcription
  Accuracy", "Pest Control Recurring Revenue Staffing"). The strategist system prompt
  (`Assemble Brand Context`) only asked for a title that contained the SEO keyword, with
  no guidance on framing. Added a "Step 5 — Headline Craft" instruction requiring a
  Stripe/Linear/Apple-grade headline that leads with the reader's problem, a sharp claim,
  or a concrete stake, rather than a dry noun-phrase or "X vs Y" label, with before/after
  examples; the SEO keyword now has to fit naturally inside that hook rather than being
  the whole title. Applies to future drafts only — does not retroactively rename the 2
  already-published posts.

## 2026-08-18 (cover images always showed physical trade equipment, regardless of topic)

### Fixed
- **`02_idea_to_asset`: hero image generation had no awareness of what the article was
  actually about, or its audience.** The strategist's own system prompt (`Assemble Brand
  Context`) hardcoded Step 3 of its cover-art direction to always depict "real physical
  trade tools, diagnostic sensors, or hardware components" — so even a Voice AI latency
  piece or a pricing/economics piece got wrenches-and-gauges cover art. The downstream
  fallback in `Parse Variants and Prepare Rows` (triggered whenever the strategist's own
  `physical_scene` was missing or too short) made it worse: a pure keyword match over the
  title/idea/trade text that always resolved to one of six hardcoded physical-hardware
  prop lists, with no "not a hands-on trade" branch at all — Voice AI, Systems
  Architecture, and Operations content fell through to a generic "diagnostic instruments
  ... engineered for {trade} operations" line.
  - **Fix:** the strategist now first decides a `visual_register` — `PHYSICAL_TRADE` (a
    technician actually diagnosing/repairing equipment) or `ABSTRACT_DATA` (the piece is
    really about software, AI systems, latency, dispatch, pricing, or strategy) — based on
    the article's real subject, not the reader's job title, and returns it alongside
    `physical_scene` in `thumbnail_card`.
  - `Parse Variants and Prepare Rows`'s fallback now honors that register when present; when
    absent, it only defaults to physical-hardware props for the five genuinely hands-on
    trades (HVAC, Plumbing, Electrical, Roofing, Pest Control) — everything else (Voice AI,
    Systems Architecture, Operations, or an abstract topic inside a physical trade) gets a
    new topic-matched abstract composition (data dashboards, waveform/latency charts,
    financial ledgers, architecture diagrams) instead of forced-in equipment.
  - Workflow re-validated: 0 errors, same 4 pre-existing warnings.

## 2026-08-18 (Claim Idea Row silently claimed 0 rows on QUEUED/stale-PICKED ideas)

### Fixed
- **`02_idea_to_asset`: `Claim Idea Row` could match 0 rows and silently do nothing.**
  Found via execution 2512 (user report: "see it failed on claim idea row node??").
  The PATCH's compare-and-set filter hardcoded `claimed_at=is.null`, but any row with a
  non-null `claimed_at` — a `QUEUED` idea that retained an old `claimed_at` from a prior
  claim cycle, or a genuinely stale `PICKED` row past the 30-minute reclaim window —
  could never match `is.null`, so the claim updated 0 rows even though `Select Target`
  had already reported `found: true`, making it look like the click did something when
  nothing was actually claimed downstream.
  - **Fix:** `Select Target` now threads the row's real current `claimed_at` through as
    `orig_claimed_at` on all three branches. `Claim Idea Row`'s `claimed_at` query param
    is now conditional: `eq.<orig_claimed_at>` when non-null, `is.null` otherwise.
  - **Verified live** by re-triggering the exact idea from the failing execution
    (`IDEA-0038`, run tag `CLAIM_FIX_VERIFY`): the claim succeeded, a fresh correctly-
    linked draft was generated. (Its status briefly reverted to `QUEUED` afterward via
    the Ideas-page "Queue" button — that specific loophole is what the next entry below
    closes.)

## 2026-08-18 (enforce one-asset-per-idea; close the re-drafting loophole)

### Fixed
- **Ideas could be drafted repeatedly, generating a second orphaned asset each time.**
  Root cause: `02_idea_to_asset`'s `Select Target` decided eligibility purely from
  `ideas.status`, and the Cockpit's Ideas page didn't recognize the pipeline's real
  post-draft status (`REVIEW`) or in-flight status (`PICKED`) in its badge logic — so a
  successfully-drafted idea fell through to the default card state and still showed a
  live "Queue" button and "Refine & Draft" CTA. Clicking either PATCHed the idea back to
  `QUEUED`/`HARVESTED`, making it eligible for another full draft run.
  - **`02_idea_to_asset` (authoritative fix):** `Read Ideas` now also selects
    `draft_asset_id`. `Select Target` refuses to select or return any idea whose
    `draft_asset_id` is already set, in all three branches (explicit request, due-queue
    auto-pick, harvested/refined fallback) — regardless of what `status` says. An
    explicit request for an already-drafted idea now returns `found:false` with
    `reason:'ALREADY_DRAFTED'` instead of silently drafting a different idea.
    `Claim Idea Row`'s compare-and-set PATCH also now requires `draft_asset_id=is.null`
    as a second guard. This makes the backend the source of truth: even if the
    dashboard (or a manual DB edit) forces status back to `QUEUED`, the workflow will
    not draft it again.
  - **Cockpit dashboard (belt-and-suspenders + UX):** `IdeaItem` now carries
    `draftAssetId`; `/api/ideas` (list) and `/api/ideas/[id]` (GET/PATCH) expose it.
    `PATCH /api/ideas/[id]` and the bulk `PATCH /api/ideas` (queue reorder) both now
    reject (`409`) any attempt to set `status` to `QUEUED`/`HARVESTED`/`REFINED` on an
    idea that already has a `draftAssetId`. Ideas page card logic and the Queue Builder
    pool filter now treat `status === "REVIEW"`, `status === "PICKED"`, and a truthy
    `draftAssetId` as "already drafted" / "drafting in progress" — so the Queue/Refine
    buttons no longer render for them, and the home page's "Currently Drafting" widget
    now also matches `PICKED` (the real transient status; it previously only matched
    `CLAIMED`/`DRAFTING`, values the pipeline never actually writes).
  - **Re-drafting is still possible on purpose:** the asset `DELETE` endpoint (`mode=
    permanent`) already clears `draftAssetId` and resets the idea to `REFINED` — so
    deleting the asset is the one supported way to make an idea eligible for a fresh
    draft again, per design.
  - Workflow re-validated: 0 errors, 4 warnings (all pre-existing). `tsc --noEmit`
    clean on the dashboard.

## 2026-08-18 (asset/claim ID collision — content loss bug)

### Fixed
- **`02_idea_to_asset`: concurrent runs silently overwrote each other's drafted content.**
  Root cause of the user-reported "workflow ran but I can't find the content, and the
  idea's status reverted": `Parse Claims and Gate` generated the next `ASSET-XXXX` /
  `CLM-XXXX` ID by reading `SELECT id ORDER BY id DESC LIMIT 1` from Supabase and adding
  1, with no locking. Any two runs overlapping in time (a manual click racing the
  `Schedule_Twice_Daily_Queue_Runner`, or two manual clicks close together — each run
  takes ~2-3 min, so this is easy to hit) would both read the same max before either
  wrote back, both compute the identical next ID, and the run that finished last would
  silently clobber the other's row on the `on_conflict=id merge-duplicates` upsert.
  - **Confirmed via n8n execution logs:** two real runs on 2026-08-17 (`IDEA-0038` and
    `IDEA-0033`) both computed `ASSET-0031`. `IDEA-0033`'s write landed last, so its
    content survived under `ASSET-0031` while `IDEA-0038`'s real generated draft (a
    Wispr/voice-AI latency piece) was overwritten and vanished from the DB, even though
    `IDEA-0038`'s row still pointed at `ASSET-0031`.
  - **Fix (per user's call — IDs don't need to be human-readable, and aren't shown to
    end users):** `assets.id` / `claims.id` have no format constraint in the schema, so
    `Parse Claims and Gate` now generates a UUID locally for each asset and claim
    instead of reading a shared counter from the DB. No DB round-trip means no two runs
    can ever race for the same ID. Removed `Read Asset Watermark (DB)` and `Read Claim
    Watermark (DB)` from the active path (disabled, left in place for reference).
  - **Cockpit UI (`src/app/page.tsx`):** removed the two spots that rendered the raw
    asset ID to the user (the "ID: ASSET-XXXX" label and the thumbnail-fallback
    monogram) since UUIDs aren't meant to be human-facing; the thumbnail fallback now
    shows the asset title's initials instead.
  - **Data recovery:** `IDEA-0038`'s real Wispr-piece content was recovered from the
    n8n execution log (`Parse Claims and Gate` / `Prepare Asset Row` output for
    execution 2493, still had the full draft, claims, and social variants) and
    reinserted as a new asset row, then `IDEA-0038.draft_asset_id` was repointed at it.
    `IDEA-0033` / `ASSET-0031` were left untouched since that pairing was already correct.
  - **Verified live:** fired two idea-draft requests at the exact same instant
    (bypassing UI delay to force a true race). Both completed with distinct UUID asset
    IDs, each correctly linked to its own idea, with no cross-contamination.
    Test ideas/assets deleted afterward.
  - Workflow re-validated: 0 errors, 4 warnings (all pre-existing/expected — the two
    now-disabled watermark nodes still pointing at each other is new but harmless).

## 2026-08-18 (hero image generation activated)

### Added
- **`02_idea_to_asset`: activated auto hero image generation.** `Qwen Image 3.0 Pro
  Generation` and `Upload Hero to R2` were wired but disabled since the workflow was
  built; every published asset was shipping without a cover image.
  - **Gap found before activating:** `Upload Hero to R2` posts to
    `https://minions.getminions.ai/api/media/ingest`, which sits behind the Cockpit's
    NextAuth middleware (the same gate that caused the earlier "Refine & Draft" 401).
    The node had no auth header configured, so enabling it as-is would have 401'd on
    every run and silently fallen back to the 24h-expiring DashScope signed URL (or the
    pollinations.ai placeholder) instead of a permanent image.
  - **Fix:** created an n8n `httpHeaderAuth` credential ("Minions Cockpit API (webhook
    secret)") holding `x-webhook-secret`, matching the dashboard's `BLOG_API_SECRET`,
    and wired it onto `Upload Hero to R2`. Then enabled both nodes.
  - Deploy check: `/api/media/ingest` was already live in production (no dashboard
    deploy needed) — confirmed via a direct authenticated curl before touching n8n.
  - **Verified live end-to-end:** triggered a real run against `IDEA-0039`. Result:
    `ASSET-0034` now has a permanent `heroImageUrl`
    (`.../assets/asset-0034-hero-*.png`) confirmed as a real 823KB PNG served from R2
    (not the expiring signed URL or the placeholder fallback).
  - Workflow re-validated after activation: 0 errors, 3 warnings (down from 5 — the two
    "connection to disabled node" warnings for this exact path are gone now that the
    nodes are enabled; remaining 3 are pre-existing/unrelated).

## 2026-08-18 (Refine & Draft targeting bug)

### Fixed
- **`02_idea_to_asset`: "Refine & Draft" ignored which idea you clicked.** The Cockpit's
  `POST /api/pipeline/draft` correctly sends the clicked idea's `idea_id` in the webhook
  payload, but two nodes discarded it entirely:
  - `Generate run_id` only generated a run UUID and threw away the trigger's request body.
  - `Select Target` re-read every eligible idea from the DB and always auto-picked the
    highest-priority/oldest one, with no awareness of which idea was actually requested.
  - **Symptom reported by user:** clicking "Refine & Draft" on `IDEA-0038` flipped the
    Cockpit UI to "CLAIMED" (an optimistic local update on webhook 200, not a confirmed
    DB write), but a different idea was silently claimed/drafted instead. On page
    reload, `/api/ideas` returned the true DB state — `IDEA-0038` was still `REFINED`,
    so the button reverted to "Refine & Draft" with no draft ever produced for it.
  - **Fix:** `Generate run_id` now captures `idea_id` from the trigger body as
    `requested_idea_id`. `Select Target` checks that value first — if the requested idea
    is still eligible, it claims exactly that one; only falls back to the existing
    priority/batch_rank/created_at auto-pick when no specific idea was requested (manual/
    scheduled runs) or the requested one is no longer eligible.
  - **Verified live:** triggered the test webhook with `idea_id: "IDEA-0038"` directly.
    Confirmed via direct DB query that `IDEA-0038` (not some other idea) was claimed,
    drafted, and moved to `REVIEW` with `draftAssetId: ASSET-0031`.
  - Workflow re-validated after the patch: 0 errors, same 5 pre-existing/unrelated
    warnings as before.

## 2026-08-18 (later)

### Audited
- **Manually checked real generated variant content** (`ASSET-0027/0028/0029`) against
  the platform rules in `Parse Claims and Gate`'s variants prompt. Findings:
  - **X/Twitter variant: 100% failure rate on the 260-char limit** across all 3 sampled
    assets (398, 418, 481 chars). `Validate Social Variants` correctly flags every one of
    these. Twitter auto-publish is currently disabled, so nothing has shipped broken, but
    the model is not respecting this constraint at all right now — worth a prompt rework
    or a hard truncation fallback if X publishing gets re-enabled.
  - **LinkedIn hashtag rule violated in 2 of 3 assets** (3 hashtags generated vs. the
    prompt's stated max of 2). This was *not* being checked by the validation gate added
    earlier today — fixed below.
  - **Formatting artifact:** the em-dash cleanup regex in `Parse Variants and Prepare
    Rows` (`cleanText`) replaced `—`/`--` without consuming surrounding whitespace,
    producing a visible `" ,  "` double-space glitch in FB/LinkedIn copy anywhere the
    writer used an em dash. Present in nearly every sampled post.
  - Hashtag *topical* mismatch spotted on `ASSET-0027` (Roofing/Insurance article): the
    LinkedIn variant correctly used `#Roofing #InsuranceTech #Operations`, but the X
    variant used `#HVAC #HomeServices #VoiceAI` — wrong industry entirely. Not currently
    checked by any gate; flagged for awareness, not yet fixed (would need a
    topic-keyword-match check, lower priority than the constraint violations above).

### Fixed
- **`02_idea_to_asset`: `Validate Social Variants` now also checks LinkedIn hashtag
  count** and adds a `variants_errors` entry when it exceeds 2, so this shows up in the
  Telegram alert going forward.
- **`02_idea_to_asset`: fixed the em-dash double-space artifact** in `Parse Variants and
  Prepare Rows`'s `cleanText` helper — the em-dash/double-hyphen regexes now consume
  surrounding whitespace before substituting `, `, matching how the writer/editor prompts
  already handle em-dash removal elsewhere in the pipeline.

## 2026-08-18

### Added
- **`02_idea_to_asset`: social variant validation gate.** New `Validate Social Variants`
  code node runs right after `Parse Variants and Prepare Rows` and checks the LinkedIn,
  Facebook, and Twitter/X copy the LLM (`qwen-flash`) generated for: empty variants, the
  X/Twitter 260-character limit, and brand-name leaks (`getminions.ai` / `minions.ai`
  instead of "Minions AI"). A new `Facebook Variant Valid?` IF node gates the live
  Facebook auto-publish step: if the Facebook variant fails validation, the run skips
  `Publish to Facebook Page` and routes straight to the Telegram alert instead of shipping
  broken copy.
  - *Why:* the variants step had zero programmatic validation despite carrying the
    strictest formatting constraints in the whole prompt chain (hard char limit, exact
    brand-name substitution). A constraint miss here was silent and went straight to a
    public Facebook post.
  - Telegram alert (`Telegram Notification`) now includes a `Social Variant Issues`
    section listing any validation failures, so a human sees *why* Facebook was skipped.
  - Verified: workflow validates clean (0 errors); IF branch split confirmed correct
    (true → publish, false → alert-only) after fixing an initial wiring bug where both
    branches landed on `main[0]`. Live test run reached `Validate Social Variants` and
    correctly flagged the X/Twitter variant as over the 260-char limit (398-418 chars vs.
    a 260 limit) on both `ASSET-0028` and `ASSET-0029` — confirming the check fires. Full
    end-to-end confirmation of the Facebook skip-on-failure branch is still pending: both
    test runs were blocked further upstream by the (unrelated, pre-existing) claims gate
    (`claims_ok: N`), so `Facebook Variant Valid?` was never reached in a live run yet.

## 2026-08-17

### Added
- **`01_idea_harvester`: TechCrunch AI signal feed.** Added `RSS - TechCrunch AI`
  (`techcrunch.com/category/artificial-intelligence/feed/`) into the market-signal merge
  chain (`Merge RSS Feeds 3`) alongside Hacker News, the n8n blog, and the home-services
  Google News query, so the PEER-lane ideas can track the broader AI industry news cycle,
  not just HN/dev-culture chatter.
- **`01_idea_harvester`: anti-plagiarism constraint.** Added STRICT CONSTRAINT 6 to
  `Build Harvest Payload`'s system prompt: never copy, closely paraphrase, or lift
  phrasing/stats/structure directly from a market signal — extract the underlying trend
  and build an original, disagreeing/extending/reframing argument instead.
  - Verified live: a test run's PEER idea explicitly reacted to a real TechCrunch
    headline ("Wispr's $2B valuation for dictation") with an original argument about
    deterministic booking state vs. transcription accuracy, not a restatement.

### Fixed
- **`01_idea_harvester`: signal-slice starvation bug.** `Build Harvest Payload` was
  slicing the first 10-15 items off the merged RSS array with no source awareness. Since
  Hacker News alone regularly returns more than that, TechCrunch (and other later-merged
  feeds) could be wired in correctly and still never reach the LLM. Replaced the blind
  slice with source-aware sampling (top 5 TechCrunch, top 5 HN, top 4 Home Services, top
  3 n8n blog) so every feed is guaranteed representation in the prompt context.
- **`01_idea_harvester`: near-duplicate ideas slipping past dedup.** Tightened the
  Jaccard token-similarity threshold in `Dedupe Ideas` from `0.6` to `0.45` after finding
  two near-identical paraphrased ideas (`IDEA-0019` / `IDEA-0025`) that had both passed
  the old threshold.
- **`01_idea_harvester`: fabricated `target_trade` on PEER-lane ideas.** `Build Harvest
  Payload`'s LANE 2 (PEER) schema example hardcoded `"target_trade": "SYSTEMS"`, a fake
  trade label with no basis in the real 5-trade ICP. Now falls through to the existing
  `UNSPECIFIED` default in `Assign Idea IDs`.
- **`01_idea_harvester`: invented precision in generated numbers.** Added STRICT
  CONSTRAINT 5 requiring dollar figures/percentages/timestamps to be grounded in the
  ticket-range table or an actual market signal, otherwise stated as an explicit
  illustrative example rather than presented as measured fact.
- **`01_idea_harvester`: unhedged market grounding.** Added STRICT CONSTRAINT 4 requiring
  at least one of the 3 generated ideas per run to explicitly reference and react to a
  real headline from the market-signal list, rather than treating signals as optional
  background flavor.
- **`02_idea_to_asset`: publish-before-sync race.** `Publish to Minions Blog` (direct
  Supabase write) previously fired before the dashboard's own asset/idea/claims DB sync
  step, so a sync failure after a successful publish could leave live, untracked "orphan"
  content on the public blog. Reordered so DB sync always completes first, on both the
  claims-gate pass and fail branches.
- **`02_idea_to_asset`: duplicate live posts on republish.** Re-publishing an asset under
  a changed title left the old slug's blog row live forever as an unlinked duplicate.
  Added `Delete Stale Blog Slug` (deletes any other blog row for the same `asset_id`)
  immediately before every publish.
- **Data cleanup:** permanently deleted 3 fake seed/demo assets (`ASSET-0001/0002/0003`,
  including one live post with a corrupted title caused by the demo data's placeholder
  content) and 2 stale/orphan blog rows left over from the publish-race and
  duplicate-slug bugs above.

## Notes
- No LLM calls in `03_review_publisher` — it is pure DB-read → publish → mark-published
  logic.
- All current LLM calls across the pipeline run on Alibaba DashScope's Qwen family
  (`qwen3.7-max`, `qwen-plus`, `qwen3.7-flash`, `qwen-flash`), tiered by task. No
  OpenAI/Anthropic/Gemini calls anywhere in the pipeline as of this writing.
- Image generation (`Qwen Image 3.0 Pro Generation` + `Upload Hero to R2`) is wired but
  currently disabled — published posts ship without an auto-generated hero image.
