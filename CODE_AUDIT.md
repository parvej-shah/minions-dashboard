# Code Audit — minions-dashboard

**Date:** 2026-08-19
**Scope:** Full repository (`src/`, `lib/`, config). Excludes `node_modules`, `.next`, `.agents/skills`.
**Stack:** Next.js 16.3.1 (App Router) · React 19 · TypeScript 5 (strict) · Prisma 7 (pg adapter) · Supabase · Tailwind 4 · NextAuth v5 beta
**Baseline:** 60 TS/TSX files · 14,098 LOC · `npx eslint .` → **60 errors, 197 warnings (257 problems)**
**Tests:** none present (no test runner, no spec files).

> **Phase 1 is read-only.** No source file was modified to produce this report.

---

## 0. Executive summary

| Area | Verdict |
|---|---|
| Duplicate logic | Severe — a whole `lib/` tree duplicated, a 180-line markdown renderer pasted twice, 3 divergent copies of the Idea DTO mapper, 2 copies of the Asset mapper, 2 copies of the channel catalogue |
| Dead code | Severe — 173 unused-variable lint warnings (mostly unused `lucide-react` icon imports), 2 fully-orphaned files, 4 unreferenced npm deps |
| Oversized files | Severe — 7 files >300 lines; the top 3 alone are 5,281 lines (37% of the codebase) |
| Consistent patterns | Poor — 4 different data-fetching styles, 3 different error-handling styles in API routes, no shared toast/modal/clipboard primitive |
| Separation of concerns | Poor — UI components call the DB layer, call third-party webhooks directly, and hold ~600 lines of seed data |
| Reusability | Poor — no `hooks/`, no `utils/`, no `constants/`; ~2,000 hardcoded hex colours |
| Structure risk | Low — no circular imports, no deep relative chains (`@/*` alias used consistently) |

**Three findings need a decision before any refactor:**
1. **Live production credentials are committed to git** (§8.1) — a Supabase service-role key, an R2 secret access key, a Postgres password, and the NextAuth secret. This is the single highest-severity item in the repo and is not fixable by refactoring alone; the keys must be rotated.
2. **14 `react-hooks/rules-of-hooks` errors** (§8.2) — `DashboardShell` and `ScheduleModal` return early *before* calling hooks. This is a latent crash, not a style nit.
3. **The Telemetry page fabricates numbers** (§8.3) — the 24h/30d ranges are the 7d figures multiplied by constants. Behaviour-preserving refactoring would preserve the fabrication.

---

## 1. Duplicate logic

### 1.1 Entire `lib/` directory duplicates `src/lib/` — **HIGH**
| Path | Status |
|---|---|
| `lib/r2.ts` (77 lines) | **Byte-identical** to `src/lib/r2.ts` |
| `lib/supabase.ts` (16 lines) | Older, pre-singleton version of `src/lib/supabase.ts` |

Nothing imports from the root `lib/` — every consumer uses the `@/lib/*` alias, which `tsconfig.json` maps to `./src/*`. Both files are git-tracked, so both leak the same secrets (§8.1).
**Fix:** Delete the root `lib/` directory entirely.

### 1.2 Markdown renderer pasted twice inside one file — **HIGH**
`src/components/editorial/EditorialStudio.tsx:1004-1106` (Split view) and `:1132-1312` (Reading view).

Both blocks run the same six-stage `.replace()` normalisation pipeline, the same `split("\n\n")` chunking, and the same per-chunk branch tree (heading / image / code fence / blockquote / paragraph). Roughly **180 duplicated lines**, differing only in Tailwind classes. Any markdown fix must currently be applied twice or the two views silently diverge.
**Fix:** Extract to `src/components/editorial/MarkdownArticle.tsx` with a `variant: "split" | "reading"` prop; move the normaliser to `src/lib/markdown.ts`.

### 1.3 Idea DTO mapper — three divergent copies — **HIGH**
| Location | Lines | Divergence |
|---|---|---|
| `src/app/api/ideas/route.ts` | 12-31 | emits `ideaId`, `draftAssetId`, `estimated_cost`, coerced `audience`/`source`/`status` defaults |
| `src/app/api/ideas/[id]/route.ts` (GET) | 21-39 | emits `priority` and **`draft_asset_id`** (snake), no `ideaId`, no `estimated_cost` |
| `src/app/api/ideas/[id]/route.ts` (PATCH) | 98-119 | emits `priority` and **`draftAssetId`** (camel), no `ideaId` |

The same record therefore arrives at the client with a different shape depending on which endpoint served it. `IdeaItem` in `src/lib/types.ts` declares `draftAssetId`, so the GET-by-id response silently fails to populate it.
**Fix:** One `toIdeaDTO(row): IdeaItem` in `src/lib/mappers/idea.ts`; make all three call sites use it. Note this is a **behaviour change** for the GET-by-id shape — see §10.

### 1.4 Asset DTO mapper — two near-identical copies — **HIGH**
`src/app/api/assets/route.ts:16-49` and `src/app/api/assets/[id]/route.ts:23-56`. ~34 lines each, character-for-character equal **except** the `target_trade` fallback: `"HVAC"` in the list route vs `"UNSPECIFIED"` in the detail route.
**Fix:** One `toAssetDTO(row)` in `src/lib/mappers/asset.ts`. The `"HVAC"` / `"UNSPECIFIED"` split is a behaviour decision — see §10.

### 1.5 Distribution-channel catalogue defined twice — **MEDIUM**
`src/app/api/channels/route.ts:5-60` (`DEFAULT_CHANNELS`, with `ruleKey`/`defaultActive`) and `src/lib/api.ts:658-704` (the client-side fallback inside `fetchDistributionChannels`, with `is_active`). Identical `id`, `key`, `name`, `platform`, `description`, `target_destination`, and `badge` strings, four channels each.
**Fix:** Single `DISTRIBUTION_CHANNELS` in `src/constants/channels.ts`; both sides derive from it.

### 1.6 `PublishedPostRecord` interface declared twice — **MEDIUM**
`src/lib/types.ts:52-69` and re-declared as an `export interface` in `src/app/api/published/route.ts:4-20`. Currently identical; nothing keeps them so.
**Fix:** Delete the route-local copy, import from `@/lib/types`.

### 1.7 `TelemetryRow` vs `TelemetryItem` — **MEDIUM**
`src/app/telemetry/page.tsx:24-38` defines `TelemetryRow` (has `title`, `audience`, `total_tokens`, `latency_ms`, `latency_sec`, `created_at`). `src/lib/types.ts:153-164` defines `TelemetryItem` (has `asset_id`, `image_model`, `latency_seconds`, `timestamp`). Same domain concept, incompatible fields; `TelemetryItem` is imported by `src/lib/api.ts` but never used anywhere.
**Fix:** Keep one shape in `src/lib/types.ts` matching what `/api/telemetry` actually returns; delete the other.

### 1.8 Clipboard-copy + "copied!" flash implemented three times — **MEDIUM**
`src/components/editorial/EditorialStudio.tsx:235`, `src/app/published/page.tsx:88`, `src/app/brand/page.tsx:518`. Each is `navigator.clipboard.writeText(text)` → `setCopiedKey(k)` → `setTimeout(() => setCopiedKey(null), 2000)`, with its own `copiedKey` state.
**Fix:** `useCopyToClipboard()` hook in `src/hooks/`.

### 1.9 Transient toast/notification implemented four times — **MEDIUM**
`saveToast` (`EditorialStudio.tsx:100`), `toastMessage` (`published/page.tsx:43`, `ideas/page.tsx:114`), `notification` (`DashboardShell.tsx:120`). Four `useState<string|null>` + `setTimeout` pairs plus four bespoke toast JSX blocks.
**Fix:** One `useToast()` hook + one `<Toast />` component.

### 1.10 Modal shell rebuilt five times — **MEDIUM**
`fixed inset-0` backdrop + centred panel is hand-rolled in `ConfirmModal.tsx`, `AdminAuthModal.tsx`, `ScheduleModal.tsx`, `DashboardShell.tsx` (command palette + mobile drawer), and `ideas/page.tsx` (edit + detail modals). Escape handling and body-scroll locking are implemented inconsistently between them.
**Fix:** One `<Modal>` primitive in `src/components/ui/`.

### 1.11 Nav-badge counts recomputed client-side from five endpoints — **MEDIUM**
`src/components/layout/DashboardShell.tsx:130-171` fires five parallel `fetch`es on every route change and re-derives counts the individual pages already compute (`page.tsx:35-60`, `published/page.tsx:93`). On every navigation the app refetches the entire dataset twice.
**Fix:** A single `/api/nav-counts` route, or lift into a shared data context.

---

## 2. Dead code

### 2.1 Orphaned files — **HIGH**
- `lib/r2.ts`, `lib/supabase.ts` — zero importers (§1.1). **Delete.**

### 2.2 Unreferenced npm dependencies — **MEDIUM**
Zero import sites anywhere in `src/` or `lib/`:

| Package | Note |
|---|---|
| `framer-motion` ^13.1.0 | large; all animation is Tailwind classes |
| `clsx` ^2.1.1 | class merging is done with template literals |
| `tailwind-merge` ^3.6.0 | same |
| `@supabase/ssr` ^0.12.4 | only `@supabase/supabase-js` is used |
| `pg` ^8.23.0 + `@types/pg` | transitive need of `@prisma/adapter-pg`; verify before removing |

**Fix:** Remove the first four from `package.json`; keep `pg` only if `@prisma/adapter-pg` needs it as a peer.

### 2.3 Unused exports — **MEDIUM**
| Export | File | Refs outside its own file |
|---|---|---|
| `getPresignedUploadUrl` | `src/lib/r2.ts:46` | 0 |
| `deleteFromR2` | `src/lib/r2.ts:70` | 0 |
| `r2Client` | `src/lib/r2.ts:10` | 0 |
| `getSupabaseClient` | `src/lib/supabase.ts:10` | 0 |
| `getSupabaseAdmin` | `src/lib/supabase.ts:28` | 0 |
| `GetObjectCommand` (import) | `src/lib/r2.ts:1` | 0 |

**Fix:** Delete `r2Client`/`GetObjectCommand`; keep `getPresignedUploadUrl`/`deleteFromR2` only if the direct-upload flow is planned, otherwise delete. Unexport the Supabase getters (they are only used by the two module-level singletons in the same file).

### 2.4 Unused types — **LOW**
`ContentPillar` and `SocialPlatform` (`src/lib/types.ts:5,41`) have zero references repo-wide. `TelemetryItem` is imported once and never used (§1.7).

### 2.5 Unused imports and variables — 173 lint warnings — **MEDIUM**
Dominated by unused `lucide-react` icons. Worst offenders:

| File | Unused count | Sample |
|---|---|---|
| `src/app/brand/page.tsx` | 35 | `ShieldCheck, Upload, Sliders, Layers, Terminal, FileText, HelpCircle, Eye, XCircle, RefreshCw, Send, Maximize2, Lock, Globe, Download, Search, Zap, Radio, Cpu` + 9 dead `useState` pairs |
| `src/components/editorial/EditorialStudio.tsx` | 16 | `Clock, FileText, CheckCircle, AlertCircle, Hash, Cpu, Filter, ClaimCheckItem, SocialVariantItem` + `showDrawer`, `lastSaved`, `filteredAssets`, `currentQueueIndex` |
| `src/components/layout/DashboardShell.tsx` | 14 | 13 icons + `currentUser` (computed from the session, then never rendered) |
| `src/app/page.tsx` | 13 | 11 icons + `fleet`, `isLoading` |
| `src/components/auth/AdminAuthModal.tsx` | 11 | incl. `supabaseClient`, `signOut`, `useSession` — **the only importer of `supabaseClient`, and it does not use it** |
| `src/lib/api.ts` | 7 | `supabaseClient`, `SocialVariantItem`, `ClaimCheckItem`, `TelemetryItem`, `BrandCategory`, `DistributionChannelKey`, `err` |

**Notably dead state** (declared, set, never read): in `brand/page.tsx` — `logoSaved`, `activePreviewAsset`, `selectedMascot`, `mascotPreviewModal`, `brandColors`, `selectedBrand`, `operatorPrompt`, `promptSaved`, and the `toggleCoverTemplate` handler. These are whole abandoned features (mascot preview, multi-brand switching, operator prompt editing) left half-wired.

**Fix:** `eslint --fix` handles none of these; remove manually, file by file. Then set `@typescript-eslint/no-unused-vars` to `error` to stop the regrowth.

### 2.6 Commented-out code — **none found.** Clean on this axis.

### 2.7 Unused API surface — **LOW**
`PUT /api/agents`, `PUT /api/agents/[id]`, `PATCH /api/fleet`, `POST /api/brand` all return `{ success: true, ...body }` without touching the database — they are stubs that acknowledge writes they never perform. No client calls them.
**Fix:** Delete, or implement. Leaving a route that lies about persisting is worse than not having it.

---

## 3. Oversized files (threshold: 300 lines)

| File | Lines | Distinct responsibilities mixed in |
|---|---|---|
| `src/components/editorial/EditorialStudio.tsx` | **2,119** | queue ribbon + keyboard nav · asset fetching · draft autosave · claims gate · **markdown renderer ×2** · three social-platform mock feeds (LinkedIn/Facebook/Twitter, each with its own editor) · publish state machine · direct n8n webhook call · unpublish/restore · permanent delete · cost breakdown panel · toast · confirm modal |
| `src/app/ideas/page.tsx` | **1,595** | three view modes (stream/queue/calendar) · CRUD for ideas · claim flow · drafting-job polling · schedule modal host · edit modal · detail modal · delete modal · filter bar · `formatRelativeTime` helper · source-badge mapping |
| `src/app/brand/page.tsx` | **1,567** | six tabs (visuals/mascots/social/directives/multi-brand/lexicon) · 3 large const catalogues (`CATEGORIES`, `MASCOT_SQUAD`, `SOCIAL_TEMPLATES`, lines 42-413) · directive CRUD · logo previewer · colour swatches · 9 abandoned state hooks |
| `src/lib/api.ts` | **726** | **~600 lines of hardcoded seed data** (`INITIAL_BRAND_DIRECTIVES`, `INITIAL_IDEAS`, `INITIAL_ASSETS`, `INITIAL_FLEET`) + 6 fetch functions + a duplicated channel catalogue |
| `src/components/layout/DashboardShell.tsx` | **717** | sidebar · mobile drawer · command palette · nav-count aggregation (5 fetches) · harvest trigger · toast · auth modal host · **hooks after early return** |
| `src/components/ideas/QueueBuilderView.tsx` | 608 | drag-and-drop queue · pool filtering · mobile tab switching · persistence `PATCH` |
| `src/app/telemetry/page.tsx` | 567 | mock ledger (lines 39-101) · summary tiles · **fabricated range multipliers** · CSV export · table |
| `src/app/published/page.tsx` | 537 | 4 platform tabs · filters · share-intent URL builders · unpublish flow · date formatting |
| `src/app/page.tsx` | 370 | KPI tiles · recent-assets list · fleet strip · social links |
| `src/components/common/DraftingProgressHUD.tsx` | 360 | polling · elapsed-time ticker · phase copy · HUD chrome |
| `src/components/auth/AdminAuthModal.tsx` | 354 | sign-in · a hardcoded Google-OAuth **setup tutorial** rendered as UI |
| `src/app/login/page.tsx` | 329 | marketing hero + sign-in form |
| `src/app/fleet/page.tsx` | 316 | fleet grid + agent cards |
| `src/components/ideas/CalendarView.tsx` | 302 | month grid + day cells + scheduling affordances |
| `src/app/api/assets/[id]/route.ts` | 242 | GET (mapper) + PATCH (**+ inline blog-table sync, lines 100-171**) + DELETE (+ blog cleanup) |

---

## 4. Inconsistent patterns

### 4.1 Four different data-fetching styles — **HIGH**
1. `fetch()` inline in a `useEffect` in the component — `EditorialStudio`, `ideas/page`, `brand/page`, `published/page`, `telemetry/page`, `fleet/page`, `DashboardShell`, `DraftingProgressHUD`, `QueueBuilderView`, `ScheduleModal`
2. Via a `src/lib/api.ts` wrapper — `page.tsx`, `drafts/page.tsx`, `DistributionControlPanel`
3. Server-side `prisma` directly in a route handler — all `/api/*`
4. Server-side `supabaseAdmin` — `fetchAgentFleet` (`src/lib/api.ts:630`), `api/auth/users`

Two ORMs reach the same database. There are **36 raw `fetch(` call sites** across `src/app` and `src/components`; only 6 of them go through the wrapper layer that exists for exactly this purpose.
**Fix:** Pick one client pattern (a thin typed `apiClient` + per-domain hooks), route every component through it, and make Prisma the only server-side data path.

### 4.2 Three error-handling styles in API routes — **MEDIUM**
| Style | Example | Problem |
|---|---|---|
| `catch (error: any)` → `{ error: error.message }` | `api/ideas/route.ts:35`, `api/ideas/[id]/route.ts:42,122,149` | **leaks internal DB errors to the client**; `any` defeats strict mode |
| `catch (error: unknown)` → narrowed message | `api/brand/directives/*`, `api/channels`, `api/media/ingest`, `api/pipeline/draft` | correct, but still returns raw messages |
| `catch (error)` → fixed generic string | `api/assets/*`, `api/agents/*`, `api/claims/*`, `api/published` | safest |

Six routes also declare `catch (error)` and never reference `error` (lint warnings in `api/agents/route.ts`, `api/agents/[id]`, `api/brand/route.ts`, `api/fleet/route.ts`, `api/brand/context`).
**Fix:** One `apiError(e, fallbackMessage, status)` helper in `src/lib/api-response.ts`; never return `error.message` to the browser.

### 4.3 Pipeline triggers: proxied vs direct — **HIGH**
`/api/pipeline/harvest` and `/api/pipeline/draft` correctly proxy n8n server-side. But `EditorialStudio.tsx:378` calls `https://n8n.getminions.ai/webhook/publish-approved-asset` **straight from the browser**, bypassing the proxy, auth, and error handling that the other two get.
**Fix:** Add `/api/pipeline/publish` and route the studio through it.

### 4.4 Blog URL host is inconsistent — **MEDIUM**
`https://getminions.ai/blog/...` in `api/assets/route.ts:28`, `api/assets/[id]/route.ts:35`, `EditorialStudio.tsx:360,420`, `drafts/page.tsx:156`, `published/page.tsx:186`.
`https://www.getminions.ai/blog/...` in `api/published/route.ts:56,60` and `DashboardShell.tsx:396,525`.
The same post therefore gets two canonical URLs depending on the surface that renders it.
**Fix:** One `BLOG_BASE_URL` constant; pick the host deliberately.

### 4.5 Default hero image differs by endpoint — **LOW**
`/images/social-covers/twitter/twitter_cover_dark.png` (`api/assets/*`) vs `/images/social-covers/github/github_social_dark.png` (`api/published/route.ts:41`).
**Fix:** One `DEFAULT_HERO_IMAGE` constant.

### 4.6 Naming conventions — **MEDIUM**
- **DTO casing:** snake_case on the wire (`raw_idea`, `hero_image_url`) mixed with camelCase escapees (`ideaId`, `draftAssetId`) in the *same object* (`src/lib/types.ts:11,25`; `api/ideas/route.ts:13,27`).
- **Hex casing:** `#161D26` vs `#161d24`, `#0F1419` vs `#0f1419`, `#1F2D3D` vs `#1f2b37` — visually near-identical values that are actually different colours, making a token extraction risky-looking when it is not.
- **Component files:** PascalCase (good) but folder grouping is inconsistent — `common/`, `ideas/`, `editorial/`, `distribution/`, `pwa/`, `auth/`, `layout/`, `providers/` mixes domain and layer taxonomies at the same level.
- **`React.useEffect`** (`telemetry/page.tsx:116`, `fleet/page.tsx:78`) vs imported `useEffect` everywhere else.
- **`AssetItem`** has *three* representations of social variants simultaneously: `social_variants[]`, `variants{}`, and `linkedin_variant`/`facebook_variant`/`x_variant` (`src/lib/types.ts:89-97`).

---

## 5. Separation-of-concerns violations

### 5.1 UI components hold ~600 lines of seed/mock data — **HIGH**
`src/lib/api.ts:20-141` (`INITIAL_BRAND_DIRECTIVES`), `:196-300` (`INITIAL_IDEAS`), `:320-560` (`INITIAL_ASSETS` — includes full article bodies), `:583-629` (`INITIAL_FLEET`). Three of these are imported directly as the **initial React state** of production pages:
- `brand/page.tsx:417` → `useState(INITIAL_BRAND_DIRECTIVES)`
- `ideas/page.tsx:82` → `useState(INITIAL_IDEAS)`
- `EditorialStudio.tsx:61,73,76,79` → `useState(INITIAL_ASSETS)` and falls back to `INITIAL_ASSETS[0]` when no asset matches

So on first paint the operator sees **fabricated ideas and fabricated draft articles** presented as real data, until the fetch resolves and replaces them. Interestingly `fetchAssets()` carries an explicit comment saying it must *never* fall back to `INITIAL_ASSETS` because "sample data in its place hides a broken pipeline" (`src/lib/api.ts:563-564`) — but `EditorialStudio` imports `INITIAL_ASSETS` directly and does exactly that.
Additional mock ledgers live in `telemetry/page.tsx:39-101` and the three catalogues in `brand/page.tsx:42-413`.
**Fix:** Move all seed data to `src/mocks/` (or delete it); initialise state to `[]` / `null` and render explicit empty and loading states.

### 5.2 Components call external services directly — **HIGH**
`EditorialStudio.tsx:378` POSTs to the n8n webhook from the browser (§4.3).
**Fix:** Server-side proxy route.

### 5.3 API routes mix persistence with presentation — **MEDIUM**
`api/assets/[id]/route.ts:100-171` — the PATCH handler contains inline blog-table sync logic: `deleteMany` on unpublish, `upsert` on publish, plus a hardcoded avatar URL (`:117`) and a nested `try/catch` swallowing sync failures. `api/published/route.ts:33-67` does an N+1-style in-memory join (`allAssets.find(...)` inside a loop) plus markdown image extraction plus copy generation (`first_comment` template).
**Fix:** Extract `src/services/publishing.ts` (blog sync) and `src/lib/mappers/published.ts`; do the join in the query.

### 5.4 Business rules embedded in UI — **MEDIUM**
Role assignment `email.includes("parvej") ? "MARKETING_DIRECTOR" : "SYSTEM_ADMIN"` appears in `src/lib/auth.ts:40` **and again** in `DashboardShell.tsx:178-180`. The publish state machine (`SYNCING → BROADCASTING → EMITTING → DONE` on `setTimeout` timers, `EditorialStudio.tsx:337-393`) is fake progress: the phases advance on timers unrelated to the actual request.
**Fix:** Role → one place in the auth layer. The fake progress bar is a behaviour decision (§10).

### 5.5 Hardcoded config scattered inline — **HIGH**
| Kind | Where |
|---|---|
| n8n webhook URLs | `api/pipeline/draft/route.ts:3`, `api/pipeline/harvest/route.ts:3`, `EditorialStudio.tsx:378` |
| Blog base URL | 12+ sites (§4.4) |
| Default hero image | 2 sites (§4.5) |
| Brand palette | `src/lib/api.ts:159-164` **and** ~2,000 inline Tailwind arbitrary values |
| Whitelisted emails | `src/lib/auth.ts:4-10` |
| Supabase project URL | `src/lib/supabase.ts:3`, `AdminAuthModal.tsx:300,330` |
| Avatar URL | `api/assets/[id]/route.ts:117` |

**Hardcoded colour census** (`#RRGGBB` literals in `src/**/*.tsx`): `#00C9A7` ×643, `#1F2D3D` ×322, `#94A3B8` ×252, `#F1F5F9` ×222, `#070B0F` ×150, `#64748B` ×147, `#161D26` ×134, `#0F1419` ×102, `#ff6b4a` ×90, `#3B82F6` ×70, `#F59E0B` ×59, `#EF4444` ×35 — **~2,000 total**. A single brand-colour change is currently a 600-site find-and-replace.
**Fix:** Tailwind 4 `@theme` tokens in the global stylesheet + `src/constants/`.

---

## 6. Reusability gaps

| Missing abstraction | Appears | Suggested home |
|---|---|---|
| `useCopyToClipboard()` | 3× (§1.8) | `src/hooks/useCopyToClipboard.ts` |
| `useToast()` + `<Toast/>` | 4× (§1.9) | `src/hooks/useToast.ts`, `src/components/ui/Toast.tsx` |
| `<Modal>` primitive | 5× (§1.10) | `src/components/ui/Modal.tsx` |
| `formatRelativeTime()` | defined in `ideas/page.tsx:62`, needed in `published`, `fleet`, `drafts`, `DraftingProgressHUD` | `src/utils/date.ts` |
| `formatCurrency()` / `formatTokens()` | `.toFixed(3)`/`.toFixed(4)` inline at 20+ sites across `telemetry`, `published`, `EditorialStudio`, `page.tsx` — and the precision is inconsistent (3 vs 4 dp for the same cost field) | `src/utils/format.ts` |
| Status → badge-class map | re-derived inline in `ideas`, `drafts`, `published`, `EditorialStudio`, `fleet` | `src/constants/status.ts` |
| `useApi<T>()` fetch hook | 36 raw `fetch` sites (§4.1) | `src/hooks/useApi.ts` |
| `toIdeaDTO` / `toAssetDTO` / `toPublishedDTO` | §1.3, §1.4 | `src/lib/mappers/` |
| `apiError()` / `apiOk()` | every route (§4.2) | `src/lib/api-response.ts` |

**Missing shared types:** the drafting-job shape (`DraftingJob`, local to `ideas/page.tsx`), the nav-count shape (`NavCounts`, local to `DashboardShell.tsx`), `MascotItem` and `SocialTemplateItem` (local to `brand/page.tsx`), and the `/api/pipeline/*` response envelope (untyped, re-parsed ad hoc at each call site).

---

## 7. Dependency & structure risks

- **Circular imports: none.** `src/lib/api.ts → ./supabase, ./types` is the only intra-lib edge and it is acyclic.
- **Deep relative chains: none.** The `@/*` alias is used consistently; only two relative imports exist repo-wide, both same-directory (`src/lib/api.ts:1,14`).
- **Duplicate module tree:** root `lib/` shadowing `src/lib/` (§1.1) — the one real structural hazard, since an editor's auto-import can pick the wrong one.
- **Missing layers:** no `hooks/`, `utils/`, `constants/`, `services/`, or `mocks/` directory exists. Everything is a page, a component, or `src/lib/api.ts`.

---

## 8. Findings that block or constrain the refactor

### 8.1 Live credentials committed to git — **CRITICAL**
| File | Line | Secret |
|---|---|---|
| `src/lib/supabase.ts` | 5 | `SUPABASE_SERVICE_ROLE_KEY` fallback — a full-privilege JWT that bypasses RLS |
| `src/lib/supabase.ts` | 4 | Supabase anon key fallback |
| `lib/supabase.ts` | 4-5 | the same two, again |
| `src/lib/r2.ts` / `lib/r2.ts` | 5-6 | R2 access key id + **secret access key** |
| `src/lib/prisma.ts` | 4 | Postgres connection string **including the password** |
| `src/lib/auth.ts` | 23 | NextAuth secret fallback |
| `src/lib/security.ts` | 13 | webhook secret fallback |

All seven files are tracked by git (`git ls-files` confirms). `.env` and `.env.local` exist locally and are ignored — the fallbacks are pure liability. Note `src/lib/supabase.ts` is imported by `AdminAuthModal.tsx`, a **client** component, so the service-role key is a candidate for the browser bundle.
**Fix:** Rotate every key, replace fallbacks with fail-fast `throw`, purge history. **This is not a refactor task — it needs to happen first and independently.**

### 8.2 Hooks called after early return — 14 lint errors — **HIGH**
`src/components/layout/DashboardShell.tsx:113-115` returns `<>{children}</>` when `pathname === "/login"`, then lines 117-190 call `useRouter`, six `useState`s, `useSession`, and two `useEffect`s. `src/components/ideas/ScheduleModal.tsx:32` returns `null` when `!isOpen`, then lines 45-47 call three `useState`s.
Navigating to or away from `/login`, or opening the schedule modal, changes the hook count between renders — React's documented crash condition.
**Fix:** Move all hooks above the early return; split the login branch into a separate layout.

### 8.3 Telemetry fabricates the 24h and 30d figures — **HIGH (behaviour)**
`src/app/telemetry/page.tsx:138-166`: the "24h" tile renders `totalPeriodSpend * 0.48`, the "30d" tile `totalPeriodSpend * 4.3`, `totalFleetTokens * 4.2`, `avgCostPerAsset * 1.02`. Only the 7d figures come from `/api/telemetry`. The other two ranges are the 7d numbers scaled by invented constants and presented as measurements.
**This one needs your decision** — see §10.

### 8.4 Other lint errors worth naming — **MEDIUM**
- `react-hooks/set-state-in-effect` ×4 (`published/page.tsx:94`, `InstallPrompt.tsx:40`, `DraftingProgressHUD.tsx:98`, `EditorialStudio.tsx:150`) — cascading renders.
- `react-hooks/immutability` ×2 (`EditorialStudio.tsx:201,208`) — props/state mutated in place.
- `react-hooks/purity` ×1 (`published/page.tsx:104`).
- `@typescript-eslint/no-explicit-any` ×32 — concentrated in `src/lib/supabase.ts:8,28`, `src/lib/auth.ts:40,41`, `api/ideas/*`, `DashboardShell.tsx:181`.
- `@next/next/no-img-element` ×23 — raw `<img>` throughout; no `next/image`.

---

## 9. Severity roll-up

| Severity | Count | Items |
|---|---|---|
| **Critical** | 1 | §8.1 committed credentials |
| **High** | 12 | §1.1 §1.2 §1.3 §1.4 · §2.1 · §4.1 §4.3 · §5.1 §5.2 §5.5 · §8.2 §8.3 |
| **Medium** | 17 | §1.5–§1.11 · §2.2 §2.3 §2.5 §2.7 · §4.2 §4.4 §4.6 · §5.3 §5.4 · §8.4 |
| **Low** | 3 | §2.4 · §2.6 · §4.5 |

---

## 10. Decisions needed from you before Phase 3

Behaviour-preserving refactoring cannot resolve these — each one is a product call:

1. **`target_trade` default** (§1.4): the list endpoint says `"HVAC"`, the detail endpoint says `"UNSPECIFIED"`. Which is correct for a merged mapper?
2. **Idea DTO shape** (§1.3): unifying the three mappers changes what `GET /api/ideas/[id]` returns (`draft_asset_id` → `draftAssetId`, gains `ideaId`/`estimated_cost`, and `priority` becomes universal). Is any external consumer — an n8n workflow, say — depending on the current per-endpoint shapes?
3. **Blog host** (§4.4): `getminions.ai` or `www.getminions.ai`?
4. **Seed data on first paint** (§5.1): should `brand`, `ideas`, and `EditorialStudio` keep showing fabricated rows before the fetch resolves, or switch to empty/loading states? (The latter is what `fetchAssets`'s own comment argues for.)
5. **Telemetry range multipliers** (§8.3): remove the fabricated 24h/30d figures (showing "—" until the API supplies real ranges), or keep them?
6. **Fake publish progress** (§5.4): `EditorialStudio`'s 800ms/1600ms/2400ms phase timers are decorative and the real network call fires inside the last timer. Tie the phases to the actual request, or keep the animation?
7. **Stub write routes** (§2.7): delete `PUT /api/agents`, `PUT /api/agents/[id]`, `PATCH /api/fleet`, `POST /api/brand`, or implement them?
8. **Unused R2 helpers** (§2.3): is a client-side direct-upload flow planned? If not, `getPresignedUploadUrl` and `deleteFromR2` go.
9. **Two ORMs** (§4.1): `fetchAgentFleet` and `/api/auth/users` use `supabaseAdmin` while everything else uses Prisma. Consolidate on Prisma? (`/api/auth/users` needs `auth.admin.listUsers()`, which Prisma cannot replace — that one stays.)
10. **Dead features in `brand/page.tsx`** (§2.5): mascot preview, multi-brand switcher, and operator-prompt editor have state but no wiring. Delete the dead state, or are these in flight?

---

## 11. Proposed structure (Phase 2)

### 11.1 Target tree

```
minions-dashboard/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  └─ login/page.tsx              ← own layout, no DashboardShell (fixes §8.2)
│  │  ├─ (dashboard)/
│  │  │  ├─ layout.tsx                  ← renders DashboardShell
│  │  │  ├─ page.tsx                    ← Mission Control (thin)
│  │  │  ├─ ideas/page.tsx              ← thin: composes ideas/* components
│  │  │  ├─ editorial/page.tsx
│  │  │  ├─ drafts/page.tsx
│  │  │  ├─ drafts/[id]/page.tsx
│  │  │  ├─ published/page.tsx
│  │  │  ├─ brand/page.tsx              ← thin: composes brand/* tab components
│  │  │  ├─ telemetry/page.tsx
│  │  │  └─ fleet/page.tsx
│  │  ├─ api/                           ← unchanged routes, bodies slimmed
│  │  │  ├─ agents/ assets/ auth/ brand/ channels/ claims/
│  │  │  ├─ fleet/ ideas/ media/ published/ telemetry/
│  │  │  ├─ nav-counts/route.ts         ← NEW, replaces 5 client fetches (§1.11)
│  │  │  ├─ pipeline/{draft,harvest,publish}/route.ts   ← publish is NEW (§4.3)
│  │  │  └─ webhooks/
│  │  ├─ layout.tsx  manifest.ts  globals.css   ← @theme colour tokens (§5.5)
│  │
│  ├─ components/
│  │  ├─ ui/                            ← NEW: presentational primitives, no data access
│  │  │  ├─ Modal.tsx                   ← from 5 hand-rolled copies (§1.10)
│  │  │  ├─ ConfirmModal.tsx            ← moved, now built on Modal
│  │  │  ├─ Toast.tsx                   ← from 4 copies (§1.9)
│  │  │  ├─ StatusBadge.tsx  Card.tsx  EmptyState.tsx  Spinner.tsx
│  │  ├─ layout/
│  │  │  ├─ DashboardShell.tsx          ← chrome only (~200 lines)
│  │  │  ├─ Sidebar.tsx  MobileNav.tsx  CommandPalette.tsx  TopBar.tsx
│  │  ├─ editorial/
│  │  │  ├─ EditorialStudio.tsx         ← orchestration only (~250 lines)
│  │  │  ├─ QueueRibbon.tsx  CoverImageCard.tsx
│  │  │  ├─ MarkdownArticle.tsx         ← the deduped renderer (§1.2)
│  │  │  ├─ ArticleEditor.tsx
│  │  │  ├─ social/{SocialVariantTabs,LinkedInCard,FacebookCard,TwitterCard}.tsx
│  │  │  ├─ ReviewDock.tsx  ClaimsGate.tsx  CostBreakdown.tsx
│  │  ├─ ideas/
│  │  │  ├─ IdeaStream.tsx  IdeaCard.tsx  IdeaFilters.tsx
│  │  │  ├─ QueueBuilderView.tsx  CalendarView.tsx
│  │  │  ├─ ScheduleModal.tsx  IdeaEditModal.tsx  IdeaDetailModal.tsx
│  │  ├─ brand/
│  │  │  ├─ DirectivesTab.tsx  VisualsTab.tsx  SocialTemplatesTab.tsx
│  │  │  ├─ MascotsTab.tsx  LexiconTab.tsx  DirectiveCard.tsx
│  │  ├─ telemetry/  { SummaryTiles.tsx, LedgerTable.tsx, ExportButton.tsx }
│  │  ├─ published/  { PlatformTabs.tsx, PublishedCard.tsx, ShareActions.tsx }
│  │  ├─ distribution/DistributionControlPanel.tsx
│  │  ├─ auth/AdminAuthModal.tsx
│  │  ├─ pwa/{InstallPrompt,PwaRegister}.tsx
│  │  └─ providers/AuthProvider.tsx
│  │
│  ├─ hooks/                            ← NEW
│  │  ├─ useApi.ts                      ← the one fetch pattern (§4.1)
│  │  ├─ useToast.ts  useCopyToClipboard.ts  useConfirm.ts
│  │  ├─ useIdeas.ts  useAssets.ts  usePublished.ts  useNavCounts.ts
│  │  └─ useDraftingJob.ts
│  │
│  ├─ services/                         ← NEW: server-side business logic
│  │  ├─ publishing.ts                  ← blog sync out of api/assets/[id] (§5.3)
│  │  ├─ pipeline.ts                    ← n8n trigger calls, one place
│  │  └─ channels.ts
│  │
│  ├─ lib/
│  │  ├─ prisma.ts  auth.ts  security.ts  supabase.ts  r2.ts   ← fallbacks removed (§8.1)
│  │  ├─ api-response.ts                ← NEW: apiOk/apiError (§4.2)
│  │  ├─ markdown.ts                    ← NEW: the normaliser (§1.2)
│  │  └─ mappers/{idea,asset,published,directive}.ts   ← NEW (§1.3, §1.4)
│  │
│  ├─ utils/                            ← NEW: pure, no I/O
│  │  ├─ date.ts        ← formatRelativeTime, formatDate
│  │  ├─ format.ts      ← formatCurrency, formatTokens, formatLatency
│  │  └─ url.ts         ← blogUrl(slug), shareIntent(platform, post)
│  │
│  ├─ constants/                        ← NEW
│  │  ├─ config.ts      ← BLOG_BASE_URL, N8N_*, DEFAULT_HERO_IMAGE
│  │  ├─ channels.ts    ← the single channel catalogue (§1.5)
│  │  ├─ status.ts      ← status → label/colour maps
│  │  ├─ brand.ts       ← CATEGORIES, MASCOT_SQUAD, SOCIAL_TEMPLATES
│  │  └─ nav.ts         ← buildNavItems
│  │
│  ├─ types/                            ← NEW (replaces src/lib/types.ts)
│  │  ├─ index.ts  idea.ts  asset.ts  brand.ts  telemetry.ts
│  │  ├─ channel.ts  published.ts  api.ts        ← envelope + nav counts
│  │
│  ├─ mocks/                            ← NEW (or deleted outright — §10 item 4)
│  │  └─ seed.ts        ← the four INITIAL_* arrays, imported by nothing in prod
│  │
│  └─ middleware.ts
└─ (root lib/ deleted)
```

### 11.2 File-by-file move map

**Deleted**
| Path | Reason |
|---|---|
| `lib/r2.ts` | identical duplicate (§1.1) |
| `lib/supabase.ts` | stale duplicate (§1.1) |
| `src/lib/api.ts` | dissolved — see split below |

**Split: `src/lib/api.ts` (726) →**
| Destination | Content |
|---|---|
| `src/mocks/seed.ts` | `INITIAL_BRAND_DIRECTIVES`, `INITIAL_IDEAS`, `INITIAL_ASSETS`, `INITIAL_FLEET` (~600 lines) |
| `src/constants/channels.ts` | the channel fallback list, merged with `api/channels`' `DEFAULT_CHANNELS` (§1.5) |
| `src/constants/brand.ts` | the `fetchBrandSettings` default payload (palette, tone, thumbnail layout) |
| `src/hooks/useAssets.ts` etc. | `fetchIdeas`, `fetchAssets`, `fetchAgentFleet`, `fetchDistributionChannels`, `updateDistributionChannel` |
| `src/services/channels.ts` | server-side channel read/write |

**Split: `EditorialStudio.tsx` (2,119) →** `EditorialStudio.tsx` (orchestration) · `QueueRibbon` · `CoverImageCard` · `ArticleEditor` · **`MarkdownArticle`** (absorbs both duplicated renderers) · `social/SocialVariantTabs` + `LinkedInCard` + `FacebookCard` + `TwitterCard` · `ReviewDock` · `ClaimsGate` · `CostBreakdown` · `lib/markdown.ts` · `services/pipeline.ts` (the direct webhook call, §4.3).

**Split: `ideas/page.tsx` (1,595) →** `page.tsx` (thin) · `IdeaStream` · `IdeaCard` · `IdeaFilters` · `IdeaEditModal` · `IdeaDetailModal` · `hooks/useIdeas.ts` · `hooks/useDraftingJob.ts` · `utils/date.ts` (`formatRelativeTime`) · `constants/status.ts` (source badges).

**Split: `brand/page.tsx` (1,567) →** `page.tsx` (tab host) · `DirectivesTab` · `VisualsTab` · `SocialTemplatesTab` · `MascotsTab` · `LexiconTab` · `constants/brand.ts` (`CATEGORIES`, `MASCOT_SQUAD`, `SOCIAL_TEMPLATES`, lines 42-413) · `types/brand.ts` (`MascotItem`, `SocialTemplateItem`).

**Split: `DashboardShell.tsx` (717) →** `DashboardShell` (chrome) · `Sidebar` · `MobileNav` · `CommandPalette` · `constants/nav.ts` (`buildNavItems`) · `hooks/useNavCounts.ts` → `api/nav-counts` (§1.11) · hooks hoisted above the early return (§8.2).

**Split: `telemetry/page.tsx` (567) →** `page.tsx` · `SummaryTiles` · `LedgerTable` · `ExportButton` · `types/telemetry.ts` (one shape, §1.7) · mock ledger → `src/mocks/seed.ts`.

**Split: `published/page.tsx` (537) →** `page.tsx` · `PlatformTabs` · `PublishedCard` · `ShareActions` · `utils/url.ts` (share intents).

**Split: `api/assets/[id]/route.ts` (242) →** route (GET/PATCH/DELETE, thin) · `lib/mappers/asset.ts` · `services/publishing.ts` (blog upsert/delete, §5.3).

**Merged (duplicate → single source of truth)**
| Duplicates | Winner |
|---|---|
| `lib/r2.ts` + `src/lib/r2.ts` | `src/lib/r2.ts` |
| `lib/supabase.ts` + `src/lib/supabase.ts` | `src/lib/supabase.ts` (singleton version) |
| 2 markdown renderers in `EditorialStudio` | `components/editorial/MarkdownArticle.tsx` + `lib/markdown.ts` |
| 3 idea mappers | `lib/mappers/idea.ts` |
| 2 asset mappers | `lib/mappers/asset.ts` |
| 2 channel catalogues | `constants/channels.ts` |
| 2 `PublishedPostRecord` | `types/published.ts` |
| `TelemetryRow` + `TelemetryItem` | `types/telemetry.ts` |
| 3 clipboard handlers | `hooks/useCopyToClipboard.ts` |
| 4 toast implementations | `hooks/useToast.ts` + `components/ui/Toast.tsx` |
| 5 modal shells | `components/ui/Modal.tsx` |
| 2 role-derivation sites | `lib/auth.ts` |
| ~2,000 hex literals | `@theme` tokens in `globals.css` |

**Moved unchanged:** `ConfirmModal` → `components/ui/`; `DraftingProgressHUD` → `components/ideas/`; `types.ts` → `types/*.ts` (re-exported from `types/index.ts` so `@/lib/types` importers can be migrated in one pass).

### 11.3 Suggested Phase 3 commit sequence

Each step ends with `npm run lint` + `npm run build`, and a dev-server smoke test of Mission Control → Ideas → Editorial → Published (there are no tests to run).

| # | Commit | Risk |
|---|---|---|
| 0 | `chore(security): remove hardcoded credential fallbacks` — **plus key rotation by you** (§8.1) | must precede everything |
| 1 | `chore: delete duplicate root lib/ directory` (§1.1) | none |
| 2 | `chore: remove unused imports, dead state, and unreferenced deps` (§2.2, §2.3, §2.5) | none |
| 3 | `fix: hoist hooks above early returns in DashboardShell and ScheduleModal` (§8.2) | low — fixes a real bug |
| 4 | `refactor: extract shared DTO mappers for idea, asset, published` (§1.3, §1.4) | **needs decisions 1-2** |
| 5 | `refactor: centralize config, colours, and channel catalogue` (§1.5, §4.4, §4.5, §5.5) | **needs decision 3** |
| 6 | `refactor: extract useToast, useCopyToClipboard, Modal, StatusBadge` (§1.8-§1.10) | low |
| 7 | `refactor: extract MarkdownArticle from EditorialStudio` (§1.2) | medium — most visible |
| 8 | `refactor: split EditorialStudio / ideas / brand / DashboardShell` (§3) | medium |
| 9 | `refactor: unify API error handling and data fetching` (§4.1, §4.2) | medium |
| 10 | `refactor: move seed data to src/mocks and add empty states` (§5.1) | **needs decision 4** |
| 11 | `refactor: proxy n8n publish through /api/pipeline/publish` (§4.3, §5.2) | medium |
| 12 | `refactor: move blog sync into services/publishing` (§5.3) | medium |
| 13 | `types: remove any, type shared hooks and component props` (§8.4) | low |

Steps 4, 5, and 10 are gated on your answers in §10. Steps 0-3 are safe to start the moment Phase 2 is approved.

---

*Phase 1 and Phase 2 complete. No source files were modified. Awaiting approval — and the §10 decisions — before Phase 3.*
