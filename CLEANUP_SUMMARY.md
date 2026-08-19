# Refactor Summary — minions-dashboard

**Date:** 2026-08-19
**Scope:** Phase 3 of the plan in `CODE_AUDIT.md`, executed under the decisions supplied with the approval.

---

## ⚠️ ROTATE THESE CREDENTIALS NOW — BEFORE ANYTHING ELSE

**The following live credentials were committed to this repository's git history in plaintext and must be treated as compromised. I removed every hardcoded fallback from the source, but I cannot rotate the keys themselves — that requires access to the provider dashboards. Rotate all four immediately, regardless of anything else in this refactor:**

1. **Supabase `SUPABASE_SERVICE_ROLE_KEY`** — a full-privilege JWT that bypasses Row Level Security. This is the most severe of the four.
2. **Cloudflare R2 `R2_SECRET_ACCESS_KEY`** (and its paired `R2_ACCESS_KEY_ID`).
3. **PostgreSQL password**, embedded in the `DATABASE_URL` connection string in `src/lib/prisma.ts`.
4. **NextAuth `AUTH_SECRET`** — forging session tokens is possible while it stands.

Also worth rotating: the Supabase anon key and the `BLOG_API_SECRET` webhook secret, both of which had committed fallbacks.

**Aggravating factor:** `src/lib/supabase.ts` instantiated the service-role client at module load, and that module was reachable from `src/lib/api.ts`, which client components imported. The service-role key was therefore a candidate for the browser bundle, not just the repo. That import path is gone (§2), but it was live until this refactor.

**Git history rewriting is a separate decision I did not act on.** Purging these values with `git filter-repo` or BFG rewrites every commit hash and breaks existing clones and open PRs. Whether it's warranted depends on whether this repo is or will become public, and who has cloned it. **Rotation is mandatory and sufficient to stop the bleeding; history rewriting only removes the historical record.** Decide on it separately.

---

## The n8n `draft_asset_id` check (decision 2)

**Result: safe to proceed, and I did — with one thing for you to be aware of.**

Grepping the whole repo for `draft_asset_id` outside the code being deleted turned up matches in exactly two places:

| Location | What it is | Impact |
|---|---|---|
| `prisma/schema.prisma:32` | `draftAssetId String? @map("draft_asset_id")` — the **database column name** | Untouched. The column is still `draft_asset_id`. |
| `CHANGELOG.md:131-136` | Documentation of the `02_idea_to_asset` n8n workflow | See below. |

The CHANGELOG entry describes n8n's `Read Ideas`, `Select Target`, and `Claim Idea Row` nodes reading and filtering on `draft_asset_id` — including a compare-and-set PATCH guarded by `draft_asset_id=is.null`. That `=is.null` is **PostgREST filter syntax**, meaning those workflows talk to the Supabase/PostgREST layer against the database column directly, not to this app's `/api/ideas` JSON. The Prisma `@map` keeps the column name identical, so the DTO rename cannot affect them.

**What you should still verify:** the n8n workflows live outside this repo, so I could only confirm this from the schema and the changelog. If any workflow consumes this app's `/api/ideas/[id]` endpoint (rather than the DB directly), it will now receive `draftAssetId` instead of `draft_asset_id`. I saw no evidence of such a consumer, but I can't prove a negative about an external system.

---

## What changed

### Removed

| Item | Detail |
|---|---|
| **Duplicate `lib/` tree** | Root `lib/r2.ts` (byte-identical to `src/lib/r2.ts`) and `lib/supabase.ts` (stale pre-singleton copy). Zero importers; both leaked the same secrets. |
| **`src/lib/api.ts`** (726 lines) | Dissolved entirely — see *Moved* below. |
| **Hardcoded credential fallbacks** | All 7 sites. Replaced with `requireEnv` / `requireOneOfEnv` in the new `src/lib/env.ts`, which throws on a missing variable instead of falling back. |
| **Stub write routes** (decision 7) | `PUT /api/agents`, `PUT /api/agents/[id]`, `PATCH /api/fleet`, `POST /api/brand` — all returned `{success: true, ...body}` without touching the database. Deleted. |
| **Unused R2 helpers** (decision 8) | `getPresignedUploadUrl`, `deleteFromR2`, `r2Client`, the `GetObjectCommand` import. |
| **Dead Brand Studio state** (decision 10) | `logoSaved`, `activePreviewAsset`, `selectedMascot`, `mascotPreviewModal`, `brandColors`, `selectedBrand`, `operatorPrompt`, `promptSaved`, `toggleCoverTemplate`, and the orphaned `multi_brand` tab variant. |
| **173 unused imports / variables** | Overwhelmingly unused `lucide-react` icons. Now zero. |
| **7 npm dependencies** | `framer-motion`, `clsx`, `tailwind-merge`, `@supabase/ssr`, `pg` + `@types/pg` (both are direct deps of `@prisma/adapter-pg`, so they still resolve), and `@aws-sdk/s3-request-presigner` (unused after the R2 helper removal). |
| **Fabricated numbers** (decision 5) | See the *Invented data removed* section below — this turned out to be broader than the audit found. |

### Merged (duplicate → single source of truth)

| Duplicates | Now |
|---|---|
| 3 divergent Idea DTO mappers | `src/lib/mappers/idea.ts` |
| 2 Asset DTO mappers (`"HVAC"` vs `"UNSPECIFIED"`) | `src/lib/mappers/asset.ts` — `UNSPECIFIED` everywhere (decision 1) |
| Published-feed mapping inline in the route | `src/lib/mappers/published.ts` |
| Brand-directive mapping inline in 2 routes | `src/lib/mappers/directive.ts` |
| **2 copies of a ~180-line markdown renderer** | `src/lib/markdown.ts` (parser) + `src/components/editorial/MarkdownArticle.tsx` (one renderer, `variant` prop) |
| 2 distribution-channel catalogues | `src/constants/channels.ts` |
| 2 `PublishedPostRecord` declarations | `src/types/published.ts` |
| `TelemetryRow` + `TelemetryItem` | `src/types/telemetry.ts` |
| 3 clipboard handlers | `src/hooks/useCopyToClipboard.ts` |
| 4 toast implementations | `src/hooks/useToast.ts` + `src/components/ui/Toast.tsx` |
| 5 hand-rolled modal shells | `src/components/ui/Modal.tsx` |
| 2 role-derivation sites | `src/constants/access.ts` (`resolveUserRole`) |
| 36 raw `fetch` call sites | `src/lib/api-client.ts` + `src/hooks/useApiResource.ts` and per-domain hooks |
| 3 error-handling styles in API routes | `src/lib/api-response.ts` (`apiError` / `apiFailure` / `apiOk`) |
| 5 parallel nav-count fetches per navigation | `GET /api/nav-counts`, one round trip |

### Moved

**`src/lib/api.ts` (726 lines) split four ways:**
- ~600 lines of seed data → `src/mocks/seed.ts` (imported by nothing in the render path)
- brand defaults → `src/constants/brand.ts`, channel fallback → `src/constants/channels.ts`
- fetch functions → `src/hooks/useApiResource.ts`, `useDistributionChannels.ts`
- server-side reads → `src/services/{brand,fleet,agents}.ts`

**`EditorialStudio.tsx`: 2,119 → 301 lines**, split into `useEditorialDraft` (hook), `QueueRibbon`, `DraftHeader`, `CoverImageCard`, `ArticleEditor`, `MarkdownArticle`, `social/SocialVariantTabs`, `ReviewDock`, `ClaimsGate`, `MobileActionBar`.

**`brand/page.tsx`: 1,567 → 520 lines**, split into `VisualsTab`, `MascotsTab`, `SocialTemplatesTab`, `LexiconTab`, plus `constants/brandAssets.ts` (355 lines of catalogues).

**`DashboardShell.tsx`: 717 → 174 lines**, split into `Sidebar`, `MobileNav` (drawer + top bar + bottom nav), `CommandPalette`, plus `constants/nav.ts` and `hooks/useNavCounts.ts`.

**`ideas/page.tsx`: 1,595 → 1,182 lines**, extracting `IdeaCard`, `IdeaDetailModal`, `constants/ideaBadges.ts`, and `utils/date.ts`.

**`telemetry/page.tsx`: 567 → 459**, `published/page.tsx`: 537 → 535, `api/assets/[id]/route.ts`: 242 → 124 (blog sync → `services/publishing.ts`).

**Route groups:** `src/app/(auth)/login/` and `src/app/(dashboard)/*` with their own layouts, replacing the pathname check that sat above `DashboardShell`'s hooks.

**New shared layers created:** `hooks/` (7), `services/` (6), `utils/` (3), `constants/` (8), `types/` (10), `lib/mappers/` (4), `components/ui/` (5), `mocks/` (1).

---

## Before / after

| Metric | Before | After |
|---|---|---|
| TS/TSX files | 60 | 125 |
| Total LOC (ts/tsx/js/mjs) | 14,098 | 15,542 |
| LOC excluding `mocks/seed.ts` | 14,098 | 14,844 |
| Files over 300 lines | 15 | 16 |
| Largest file | 2,119 | 1,182 |
| Top 3 files combined | 5,281 (37% of codebase) | 2,317 (15%) |
| **ESLint** | **60 errors, 197 warnings** | **0 errors, 0 warnings** |
| `tsc --noEmit` | clean | clean |
| Tests | none | 15 passing |
| npm dependencies | 15 + 11 dev | 8 + 11 dev |

**On the line count going up rather than down.** The audit predicted reduction; it rose ~750 lines (~5%) excluding the mock fixtures. Three causes, all deliberate: (1) explicit prop interfaces and TypeScript types for 30+ new components and hooks, which did not exist before; (2) real loading and empty states on six surfaces that previously rendered mock rows instead; (3) doc comments explaining non-obvious decisions. The genuine deletions — 480 duplicated lines, 173 unused identifiers, 4 dead routes, an entire duplicated `lib/` tree — were real but smaller than the structure they were replaced with. **File count doubling is the more meaningful signal here: the same behavior now lives in single-responsibility units.**

---

## Verification

Run after every step, and again at the end:

```
$ npx eslint .
(no output — 0 problems)

$ npx tsc --noEmit
(no output)

$ npx vitest run
 ✓ src/lib/mappers/mappers.test.ts (15 tests) 62ms
 Test Files  1 passed (1)
      Tests  15 passed (15)

$ npm run build
 ✓ Compiled successfully in 2.6s
 33 routes generated
```

**Smoke test** against the dev server with a live database:

- All 11 API endpoints return `200` with real data: `/api/ideas`, `/api/assets`, `/api/published`, `/api/nav-counts`, `/api/telemetry`, `/api/channels`, `/api/brand`, `/api/brand/directives`, `/api/brand/context`, `/api/agents`, `/api/fleet`.
- All 8 dashboard routes correctly `307` to `/login` when unauthenticated; `/login` renders `200` outside the shell — confirming the route-group split works.
- Shape assertions against live data: idea list DTO ≡ idea by-id DTO ✓; asset list DTO ≡ asset by-id DTO ✓; no `draft_asset_id` key in any response ✓; `target_trade` returns `UNSPECIFIED` for missing values while preserving real trades ✓; every `doc_url` / `published_url` on the no-www host ✓; `claims[]` and `variants{}` present ✓.
- No runtime errors in the dev server log.

**Gap in verification — please check this yourself.** The Chrome extension was not connected, so I could not log in and exercise the four flows interactively (Mission Control → Ideas → Editorial → Published). Everything above is HTTP-level plus type/lint/build/test. **The logged-in UI has not been clicked through.** The Editorial Studio in particular was restructured heavily and deserves a manual pass: draft switching, save, publish, unpublish, delete, and the social variant editors.

---

## Bugs found and fixed along the way

These were latent defects the type system exposed once the DTOs were unified — not things the audit predicted:

1. **The Claims Gate never worked against real data.** `EditorialStudio` read `activeAsset.claim_checks`; the API has only ever returned `claims`. The panel was permanently empty in production and only ever populated from `INITIAL_ASSETS`. Now reads `claims`.
2. **Social variant cards showed placeholder copy.** They looked up `activeAsset.social_variants`, another field the API never returned, and silently fell through to hardcoded sample text. Now read `variants`.
3. **`blog_url` never existed on the wire.** Every `asset.blog_url || <template>` fallback always took the template branch. Replaced with `doc_url`.
4. **Telemetry CSV export exported the mock ledger,** not the data on screen (`TELEMETRY_LEDGER` instead of `ledgerData`).
5. **Publish reported success before the request ran.** The four phases advanced on 800/1600/2400 ms timers with the real network call inside the last one; failures were invisible. Now driven by the actual request (decision 6), with an error state.
6. **`GET /api/ideas/[id]` populated nothing.** It emitted `draft_asset_id` while `IdeaItem` declared `draftAssetId`.
7. **Hooks after early returns** in `DashboardShell` (11 violations) and `ScheduleModal` (3) — a real crash condition on navigation. Fixed via route groups and hoisting.
8. **`agent_workers` table does not exist** in the Supabase project. The old code swallowed the error and returned `INITIAL_FLEET`, so the dashboard showed 4 fake agents. It now logs honestly — and I repointed the sidebar badge and Mission Control at `/api/agents` (Prisma-derived, real), which reports 4 actual agents rather than 0.

---

## Invented data removed (decision 5)

Decision 5 said "do not invent numbers anywhere in the app." Applying that literally found more than the telemetry multipliers:

| Location | What it was |
|---|---|
| `telemetry/page.tsx` | 24h and 30d tiles were the 7d figures × `0.48`, `4.2`, `4.3`, `1.02`. Now `—` with "Not available for this range yet". |
| `telemetry/page.tsx` | Hardcoded deltas `-2.5%`, `+5.1%`, `-45ms`, `-4.2%`, `+12.4%`, `-180ms`, `-6.8%`, `+24.0%`, `-210ms`. Removed. |
| `telemetry/page.tsx` | "~3.8¢ total per 5-stage asset" asserted as fact. Replaced with a description of the real figure above it. |
| `EditorialStudio` cost panel | A per-model breakdown of four fixed constants (`0.012`, `0.018`, `0.005`, `0.0036`) that did not sum to the displayed total and never varied by asset. Removed; only the recorded `generation_cost` remains. |
| `page.tsx` (Mission Control) | "View All **18** Broadcasts", "**3** Omnichannel Channels" — both hardcoded. |
| Command palette | Three fabricated results: a specific draft id (`ASSET-0003`), "4 Live", and a sample idea title. It also never used the text you typed. Now filters real destinations. |
| `IdeaCard` | `idea.target_trade \|\| "HVAC"` — the same fabricated fallback decision 1 targeted, in the UI layer. Now `UNSPECIFIED`. |

Seed data (decision 4) is now in `src/mocks/seed.ts` and imported by nothing in the render path. Brand, Ideas, Editorial, Drafts, Published, and Telemetry all start empty and show explicit loading and empty states.

---

## Deviations from the plan

1. **Commit sequencing.** The plan asked for one commit per step. **I made no commits at all** — the working tree already had uncommitted changes when I started (`prisma/schema.prisma`, `src/app/fleet/page.tsx`, and 5 more), and committing would have mixed your work with mine. Everything is staged in the working tree for you to review and split as you see fit. `CODE_AUDIT.md` and `CLEANUP_SUMMARY.md` are new untracked files.

2. **Step ordering.** Steps 0 and 4 could not stay separate. Removing the credential fallbacks required changing `src/lib/supabase.ts`'s exports, which broke `src/lib/api.ts`, which forced the type unification early. The work all landed; the boundaries between steps 0-4 blurred.

3. **One new dependency: `vitest` (dev-only).** Explicitly authorised by step 0.5, which permitted test tooling. No runtime dependencies were added; seven were removed.

4. **`ideas/page.tsx` is still 1,182 lines.** I extracted `IdeaCard`, `IdeaDetailModal`, the badge helpers, and the data layer, but the inject-idea and edit-idea slide-over drawers (~370 lines combined) are still inline. They are tightly coupled to a dozen pieces of form state, and splitting them cleanly needs a form-state decision I'd rather not make unilaterally. It is the one file that did not reach the Phase 2 target.

5. **Markdown split view gained capabilities.** Deduplicating the two renderers means the split view now renders code fences and lists properly — the compact copy lacked those branches and showed raw ``` markers. This is a visible improvement, not a regression, but it is a behavior change.

6. **`/api/assets/[id]` PATCH still accepts both variant shapes.** I kept the top-level `linkedin_variant` / `facebook_variant` / `x_variant` fields alongside the nested `variants.*` object, in case an n8n workflow writes the flat form. Slightly redundant, deliberately so.

---

## Session 2 — follow-up work completed

| Item | Detail |
|---|---|
| **Middleware → Proxy** (was item 6) | `src/middleware.ts` renamed to `src/proxy.ts` per the Next 16 convention, after reading the shipped docs. Auth-gate logic unchanged. Note `next lint` no longer exists in Next 16 — use `npx eslint .`. |
| **Real per-range telemetry** (was item 5) | `/api/telemetry` now accepts `?range=24h|7d|30d|all` and filters `assets.created_at` server-side. All four tiles show real aggregates. |
| **Server-side fabrication removed** | The original audit missed this: `/api/telemetry` was *itself* inventing tokens and latency (`wordCount * 1.35 * 6.2` split 0.11/0.62/0.27, `latencyMs = 1350 + idx*45`, plus `0.0382`/`0.0384`/`1420` fallbacks). The schema records neither tokens nor latency — the `Asset` model has no such columns. Those fields are now `null` in the payload and render as "Not recorded" in the UI. |
| **Fleet aligned to n8n reality** | See below. |
| **`/api/fleet` + `services/fleet.ts` deleted** (was item 4) | The `agent_workers` table does not exist and nothing consumed the route. `/api/agents` is now the only fleet source. |

### Fleet alignment (the n8n ground truth)

The dashboard claimed 4 agents. The live workflows run **7 model calls**. Every value in the new `src/constants/fleet.ts` was read off the n8n node definitions:

| Worker | Workflow · Node | Model | temp | max_tokens |
|---|---|---|---|---|
| 001 Signal Harvester | `01_idea_harvester` · Qwen Harvest | `qwen3.7-max` | 0.75 | 2500 |
| 002 Signal Refiner | `01_idea_harvester` · Qwen Refine | `qwen-flash` | 0.6 | 1500 |
| 003 Marketing Strategist | `02_idea_to_asset` · Qwen Call 1 Strategist | `qwen3.7-max` | 0.5 | 2000 |
| 004 Staff Writer | `02_idea_to_asset` · Qwen Call 2 Writer | `qwen-plus` | 0.7 | 4000 |
| 005 Lead Editorial Reviewer | `02_idea_to_asset` · Qwen Call 3 Editor | `qwen3.7-flash` | 0.3 | 4000 |
| 006 Social Distribution Writer | `02_idea_to_asset` · Qwen Call 4 Variants | `qwen-flash` | 0.8 | 2500 |
| 007 Visual Art Director | `02_idea_to_asset` · Qwen Image 3.0 Pro Generation | `qwen-image-3.0-pro` | — | 1280×720 |

Providers: text → `dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`; image → `.../api/v1/services/aigc/multimodal-generation/generation`.

What was wrong before, and is now fixed:

- The two harvester stages were **missing from the fleet entirely**.
- The variants stage is a **separate `qwen-flash` call**; the app folded social copy into the editor's role description.
- `MODEL_RATE_CARD` claimed `qwen3.7-flash` covered "Stages 3 & 4" — false — and listed `qwen-image-3.0` instead of `qwen-image-3.0-pro`.
- All four agents reported `total_runs = asset count`, but the harvester stages run per **idea**. Harvester run totals are now counted from ideas the pipeline produced (`source != 'MANUAL'`); the five `02` stages from assets. Each stage carries a `runs_unit` so the card says what it is counting.
- The Fleet page's hardcoded status of `"ACTIVE"` for all four is gone: status is derived from whether that workflow ran in the last 24h, and renders as `—` until `/api/agents` answers rather than guessing.

**No `agent_workers` table was created.** The fleet is a description of the workflows, not operator-editable data — putting it in a table would only create a second thing to keep in sync with n8n. If a node is retuned in n8n, update `src/constants/fleet.ts` in the same change.

---

## Publish-path consistency pass (found by clicking through the live data)

The cockpit showed **three different numbers for "published"** at once: the sidebar said 8 Live (blog rows), Mission Control said 2 (assets with `status = PUBLISHED`), and the Published page's channel tabs each claimed 8 social posts. Reading the live database explained why, and turned up a set of related defects.

**What the data actually says:** 8 blog rows — 2 backed by an asset marked PUBLISHED, **4 backed by an asset still sitting in `PENDING_REVIEW`** (already live on the blog while the Studio presented them as fresh drafts to publish), and **2 orphans** whose `asset_id` points at a row that no longer exists.

| Fix | Detail |
|---|---|
| **Mission Control counts the blog** | The published tile and the broadcast list now read `/api/published`, the same source as the sidebar badge and the Published page. All three agree. |
| **"Already live" is surfaced in the Studio** | `AssetItem` carries `live_blog_url`, resolved by joining blog rows in `/api/assets`. The review dock shows an amber "This post is already live on the blog" warning with a link to it, and the publish button becomes "Republish (Overwrites the Live Post)". The queue ribbon gets a `Live · Unreviewed (n)` pill and marks those cards. |
| **Duplicate blog rows on republish** | Both publish paths (`services/publishing.ts` and the `asset-ready`/`published` webhook) upserted on `slug`, which is the blog primary key. A republish after a title change therefore created a **second live post for the same asset**. Both now rebind the asset's existing row to the new slug instead. |
| **Byline reroll** | `upsertToBlog`'s update branch reassigned `buildAuthor()` — a random pick between two founders — on every republish, so a live post could change its author. The byline is now set once, on create. |
| **`published_urls` format split** | The webhook wrote `JSON.stringify(posts)` while the mapper read it with `split(",")`, tearing rows into fragments like `["https://a`. The webhook now writes the comma form, and the mapper reads both (rows in the old format already exist). Covered by two new tests. |
| **Colliding React keys** | `toPublishedDTO` keyed on `assetId`, so two blog rows for one asset produced identical `id`s. Keyed on `slug` (the actual PK) now. |
| **Invented cost and dangling ids** | An orphan blog row was given `cost_usd = 0.038` (the default, presented as a measurement) and a fabricated `ASSET-0001` id whose Studio link went nowhere. Both are `null` now; the card shows "—" and "No asset", Unpublish is disabled, and the Total Spend tile says how many posts it excluded. |
| **Channel tabs asserted posts that don't exist** | Every social tab showed `feed.length`, and the header claimed `feed.length * 4` "broadcasts". They now count posts that actually carry copy for that channel (8 / 6 / 6 / 6), and the tile reads "Channel copy ready — live articles plus the social variants that exist". |
| **Silent webhook no-ops** | `/api/webhooks/published` returned `success` even when its `updateMany` matched no asset. It now reports `asset_updated` and whether the blog row was created, updated, or reslugged. |

### Social posting status (there wasn't any)

The social tabs showed ready-to-post copy and a share button, and **nothing anywhere said whether a post had actually gone out**. There is no integration with LinkedIn, Facebook, or X — the share buttons open the network's own share dialog, so posting is manual and unobserved. The only evidence a post exists is a permalink written into `assets.published_urls`.

That column is now surfaced end to end: `src/lib/channels.ts` classifies a URL by host (`linkedin.com`/`lnkd.in`, `facebook.com`/`fb.me`, `twitter.com`/`x.com`/`t.co`), `PublishedPostRecord.channel_urls` carries one permalink per channel, and each social card shows a teal **● Posted** chip linking to the live post or a grey **○ Not posted** chip. Where nothing is recorded, a **Mark posted** action takes the permalink and PATCHes it back, so the status is something an operator can actually maintain. The header tile reports how many social posts are recorded as live. Right now that is 1 — a Facebook URL on one asset.

The chips deliberately say "not posted", not "failed": absence of a permalink means the cockpit has no evidence, which is not the same as a post that did not happen. Three tests cover the URL classification.

Also removed while clicking through: fabricated X engagement counts (18 replies / 34 reposts / 142 likes / 4.2K views) on an **unposted** draft preview; the invented fallback LinkedIn/Facebook/X copy that filled empty variants with plausible-looking prose (now an explicit empty state); the "2K" cover-art claims, which are `1280×720` per the n8n node; and the drafting HUD's timer-driven stage progress — it asserted which agent was running from hardcoded 12s/22s/14s/12s estimates and a percentage derived from wall-clock. It now shows the real five-stage sequence, an indeterminate bar, elapsed time, and completion driven by the poll that was already there.

---

## Live data reconciliation (2026-08-19, applied)

The code fixes above stopped the cockpit *misreporting* the state of the blog; these writes fixed the state itself. Both were run against the live database at the operator's request.

**Four posts were live while their asset sat in `PENDING_REVIEW`** — the Studio was offering them for publishing a second time. Each asset was set to `PUBLISHED` with `published_at` taken from its blog row, so it records when the post actually went live rather than when the reconciliation ran:

| Asset | Went live | Title |
|---|---|---|
| `b3e7053f…` | 2026-08-18 06:01Z | Why Horizontal AI Automation Failed Trade Voice Dispatch |
| `e97e1e0b…` | 2026-08-18 04:55Z | Why Trade Voice AI Needs State Machines Over Transcription Accuracy |
| `3279465b…` | 2026-08-18 13:01Z | Stop Eating Warranty Costs: The Slab Leak Triage Protocol |
| `6e29c012…` | 2026-08-18 19:01Z | The Permit Clerk Math: Why Back-Office Automation Beats Dispatch ROI |

**Two orphan blog rows were deleted**, taking the posts off the public blog: `/blog/hvac-dispatch-triage-protocol` and `/blog/hvac-missed-call-recovery-protocol`. Their `asset_id` pointed at rows that no longer existed, so nothing in the cockpit could edit, unpublish, or cost them.

**Both rows were backed up in full before the delete** to `orphan-blog-rows-backup-2026-08-19.json` in the repo root (untracked, ~7.8 KB, includes the complete markdown content). Restore from it if either post is wanted back; delete the file once you're satisfied.

Result: 6 blog rows, every one matched to an asset marked `PUBLISHED`; 12 assets genuinely awaiting review. Every count in the cockpit now agrees.

---

## One idea → one asset (2026-08-19, enforced)

Two ideas had already produced two assets each — and one of those pairs is why three near-identical voice-AI posts were live: `IDEA-0038` was drafted twice, nine hours apart.

**How it happened.** `Select Target` in n8n refuses an idea whose `draft_asset_id` is set, but that column is only written at the *end* of a run, by `Sync Idea to DB`. That node carries `neverError: true` + `onError: continueRegularOutput`, so if it failed the idea stayed `PICKED` with a null `draft_asset_id` — and 30 minutes later the stale-claim rule made it eligible again. The twice-daily scheduler then drafted it a second time with a fresh asset UUID. `Claim Idea Row` had the same silent-failure settings and nothing checked whether its compare-and-set actually matched a row, so a lost race would also have proceeded to draft.

Three layers now, because the first two cannot be done in application code — n8n writes assets **straight to PostgREST** (`POST /rest/v1/assets`) with the service-role key and never touches this app:

| Layer | What it does |
|---|---|
| **`assets.idea_id` unique index** (applied) | `CREATE UNIQUE INDEX CONCURRENTLY assets_idea_id_key ON assets (idea_id)`. A second asset for the same idea now fails with `23505` / Prisma `P2002`. NULL `idea_id` is unconstrained, so assets with no idea are unaffected. Recorded as `@@unique([ideaId])` in `schema.prisma`, with the SQL and its pre-flight check in `prisma/sql/2026-08-19-one-asset-per-idea.sql`. **Verified by inserting a duplicate inside a rolled-back transaction — rejected.** |
| **n8n gate** (applied to the live `02_idea_to_asset`) | `Claim Idea Row` gets `alwaysOutputData`, then two new nodes: **Claim Landed?** (did the compare-and-set return a row? no → `NoOp Nothing to Draft`) and **Read Assets For Idea → Idea Already Has Asset?** (does an asset already exist for this idea? yes → `NoOp`). Both gates sit *before* the strategist call, so a doomed run costs one HTTP request instead of five model calls. Workflow validates clean and stayed active. |
| **App guards** | `/api/pipeline/draft` refuses to trigger a run for an idea that already has an asset (409) or one currently `PICKED`, and 404s an idea that does not exist. `/api/webhooks/asset-ready` updates the existing asset in place rather than creating a second, and reports `duplicate_prevented`. The Idea Stream surfaces the refusal text and clears the drafting HUD instead of leaving it spinning. |

**Duplicates removed** (per the operator's decision), backed up first to `duplicate-assets-backup-2026-08-19.json` in the repo root — both assets with their claims, and the blog row:

- `ASSET-0011` "The Thermal Lockout" (unreviewed draft, `IDEA-0010`) — deleted with 7 claims.
- `e97e1e0b…` "Why Trade Voice AI Needs State Machines Over Transcription Accuracy" (`IDEA-0038`) — deleted with 8 claims, **and its live blog post taken down**.

Each idea was then repointed at the asset it kept (`IDEA-0010` → `ASSET-0009`, `IDEA-0038` → `53ac606e…`), so no `draft_asset_id` dangles.

---

## Still needs a human decision

1. **Rotate the four credentials** (top of this document). Blocking.
2. **Git history rewrite** — yes or no, depending on repo visibility.
3. **Two remaining voice-AI posts still overlap.** `why-horizontal-ai-automation-failed-trade-voice-dispatch` and `voice-ai-state-management-vs-transcription-accuracy` argue adjacent theses (the third was removed as a duplicate). A content-level judgement, not a bug.
4. **`prisma/schema.prisma` still has `targetTrade String @default("HVAC")`.** Decision 1 was "`UNSPECIFIED` everywhere"; the application layer now honours that, but changing the column default needs a migration against the live database, which I did not run.
5. **`src/mocks/seed.ts` (533 lines) is unreferenced** and `DEMO_IDEAS` / `DEMO_ASSETS` predate the DTO unification. Delete it or refresh it; stale fixtures invite misplaced trust.
6. **`QueueBuilderView.tsx` (605 lines)** and **`SocialVariantTabs.tsx` (433 lines)** are next in line for splitting. `ideas/page.tsx` is still 1,182 lines with ~370 of inline drawer markup.
7. **`react-hooks/set-state-in-effect` workarounds.** Four effects defer their initial `setState` via `setTimeout(fn, 0)`. Functionally correct but awkward; suppressing the rule for legitimate async loading would be cleaner.

---

## Files you'll want to look at first

- `src/lib/env.ts` — the new fail-fast credential access, and the `assertServerOnly` guard that keeps the service-role key out of the browser bundle.
- `src/lib/mappers/` — the four DTO mappers and their 15 tests in `mappers.test.ts`.
- `src/hooks/useEditorialDraft.ts` — all Editorial Studio state and mutations, including the real publish flow.
- `src/lib/api-client.ts` + `src/lib/api-response.ts` — the two ends of the unified request/error contract.
- `src/constants/config.ts` — every URL, host, and default that used to be scattered inline.
