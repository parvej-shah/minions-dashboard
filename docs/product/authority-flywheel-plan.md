# Authority flywheel: product plan

Status: phases 0–4 BUILT (2026-09-23/24); see "Progress" at the end. Written 2026-09-23 from
[the strategy conversation](2026-09-23-strategy-conversation.md) and a read of
the code as of commit `26c0b42`.

Goal: Minions stops producing generic AI commentary and produces content only
this user could have written, for one clear ICP. That content builds authority
first. Consistency comes second, and indirect demand is the outcome. LinkedIn
impressions are the first measured signal.

---

## 1. Decisions locked

| # | Decision | Source |
|---|---|---|
| D1 | Priority order: **authority > consistency > indirect demand**. Authority is the goal, consistency is an operating constraint, demand is the outcome. A below-bar post is never presented as a strong one; see D17. | Round 2 Q1, refined |
| D2 | **One clear ICP per tenant.** | Round 2 Q2 |
| D3 | Onboarding stays as short as it is now. Deeper profiling is gathered over time on the Brand page. | Round 2 Q4 |
| D4 | Confidential notes are not accepted. Users may share material only with confidential details removed. | Round 2 Q5 |
| D5 | Cadence is the user's choice. **The default is 3 posts a week.** | Round 2 Q6, round 3 Q2 |
| D6 | A weekly alignment question, asked once a week. | Round 3 Q1 |
| D7 | Personal profile and company page get **substantially different posts** from the same idea, each in its own voice. Publishing to the company page is optional. | Round 2 Q3, round 3 Q3 |
| D8 | Performance learning **recommends**. The user accepts or rejects, and nothing changes the strategy silently. | Round 3 Q4 |
| D9 | Analytics are **LinkedIn only** at first. This needs the LinkedIn app verified. | Round 3 Q5 |
| D10 | Covers use one clean editorial system, customised per brand. More styles come later. | Round 1 Q6 |
| D11 | Carousels come later, at **≤ 5–10 BDT per carousel** all in. | Round 1 Q7 |
| D12 | The six parts of the LinkedIn/Edelman flywheel (white space, relevance, vision, trust, brevity, attribution) are implemented as **idea metadata, gates, scoring and analytics**, never as a template every post must follow. | Part 2 |
| D13 | Impressions are the first KPI, read as an **attention signal**, not as ROI. Each post is compared with the same user's rolling median. | Part 2 |
| D14 | **PEER and BRIDGE are removed.** There is one ICP and no audience lanes. | Q1, 2026-09-23 |
| D15 | No legal entity is registered yet, and the user is admin of the getminions.ai LinkedIn page. The Community Management application waits until the company is registered. | Q2 |
| D16 | The weekly question is an **in-app prompt**. The first version is **text only**, with no voice notes. | Q3, Q4 |
| D17 | **Every scheduled slot gets a post idea.** Slots are never skipped. D1 still holds in this form: a below-bar idea is never passed off as a strong one (see phase 7). | Q5 |
| D18 | **Each user picks their channels**: blog only, LinkedIn only, or both. | Q6 |

## 2. Where I disagree with the conversation, or would tighten it

1. **Don't let the LLM output 0–100 scores.** `authority_score: 92` from a model
   is poorly calibrated and drifts between runs, and the current `icp_relevance`
   is already mostly noise. Instead, the model answers rubric questions with
   short evidence: which memory item, which ICP pain, what is new. Code then
   computes the score. That makes the score testable and auditable.
2. **The gate should require `author_advantage`, not "white_space OR
   author_advantage".** White space without author advantage is exactly the
   generic AI take we are trying to stop: a new angle that anyone could write.
   The hard gate is: a specific ICP problem **and** a concrete author advantage
   tied to a real memory item or proof. White space and vision count toward the
   score but don't gate.
3. **"Predicted impressions 25%" has no data behind it** until a tenant has
   posts with metrics. The proposed weights are: 40% authority, 25% predicted
   impressions, 15% ICP relevance, 10% originality, 10% evidence. Until a tenant
   has about 15 measured posts, the predicted-impressions weight should be 0 and
   its 25% spread across the other four.
4. **An evaluation harness has to come first.** "Better ideas" can't be measured
   today. The golden tests prove prompts render *identically*, not that the
   output is *better*. Without a baseline, a prompt rewrite is a matter of taste.
5. **The LinkedIn app review is the long pole**, and not all of it is technical:
   a registered legal entity, a privacy policy, a company page super admin, and a
   screencast. There is no legal entity yet (D15), so the first step is
   registering the company.
6. **One ICP conflicts with the existing `AudienceLane` (ICP / PEER / BRIDGE).**
   Directive scoping, strategist targets and idea rows all use it. This is
   decided (D14): PEER and BRIDGE are removed, and the migration is in phase 1.

## 3. What the code has today, and the gaps

| Area | Today (verified in code) | Gap |
|---|---|---|
| Idea shape | `Idea` has `pillar`, `audience`, `why`, `icpRelevance`, `targetTrade @default("HVAC")`, `pillar @default("Contractor Realities")` | No source type, ICP problem, author advantage, white space, vision, trust basis or lane. Tenant-zero defaults are still in the schema. |
| Refine prompt | `src/lib/prompts/refine.ts` has 4 fixed pillars, including "Contractor Realities" | Tenant-zero values are hardcoded into every tenant's refinement. |
| Harvest prompt | `harvest.ts` falls back to a generic Stakes/Myth/How-It-Works rotation; the inputs are brand context plus RSS signals | No professional memory, no ICP model, no source mix. RSS sets the point of view. |
| Strategist | `hookArchetypeFor(pillar)` does substring matching on pillar names | Needs to key off lanes and source type. |
| Brand page | Positioning, topics, one audience, voice, samples, phrases, sourced proof, look, sources, schedule | No Experience & Activity section, no structured ICP (pains, decisions, questions), no completeness prompts. |
| Sources | `IdeaSource` per tenant (RSS/GOOGLE_NEWS/REDDIT/SITEMAP) | Only market signals; nothing about the user's own work. |
| Schedule | `PostingSchedule`: cadence, times, requireReview | No lanes, objectives or per-slot purpose, and no rule for filling a slot when no strong idea is ready. |
| LinkedIn | OAuth scope `openid profile email w_member_social`; the options route already lists admin orgs through `organizationAcls`; `ClientChannel @@unique([clientId, channelKey])` | Only one LinkedIn target per tenant (personal **or** org). No analytics scope. One variant per asset. |
| Covers | 04 renders the headline with Qwen image generation | The model garbles text (seen on smoke asset `02cc7c94…`). Cost and quality are both uncontrolled. |
| Performance | The Telemetry page shows words, claims, velocity and cost | These are production metrics. Nothing measures how content performs. |
| Safety | Claims gate, verbatim guard, writer standing, approved proofs | Known loopholes: unsupported claims and prompt injection from source text (item 9 in the conversation). |

## 4. Principles for every phase

- **Prompts stay in `src/lib/prompts`**. Every change goes through the golden
  tests (`UPDATE_GOLDEN=1` only for intended changes) **and** the eval harness
  from phase 0. A prompt PR shows its eval delta.
- **Decisions are made in code, not by the LLM.** Gates, quotas, rankings and
  slot filling live in tested TypeScript or code nodes. The model supplies
  labelled evidence.
- **n8n changes go through `n8n/`**: pull, edit, lint, contract test, push.
  New workflows are added to `manifest.json`, and any new schedule needs a
  stated reason.
- **Schema changes are additive first.** Add nullable columns, backfill, then
  tighten. n8n writes through PostgREST, so a column must exist before any
  workflow writes it.
- **Per-post cost budget.** Every phase states its added LLM and image cost. The
  current generation cost is about $0.038 per asset.
- **Each phase ships behind a per-tenant flag** and is tried on tenant zero first.

## 5. Phases

The dependency graph is at the end of this section. Phases 0, 5 and the
LinkedIn application run in parallel from the start.

### Phase 0: Foundations and baseline (about 1 week)

- **0.1 Remove tenant-zero leftovers.** Move the refine pillars into tenant
  data (lanes arrive in phase 1; until then, a neutral set). Drop the `HVAC` and
  `Contractor Realities` column defaults. Run
  `scripts/fix-tenant-zero-brand.ts` (still pending).
- **0.2 Eval harness** (`src/test/eval/`, run manually, never in CI):
  - A fixed corpus of 3 tenants: tenant zero, a real-estate voice-agent seller,
    and one outside our niche. Each has about 20 signals and about 10 memory
    items.
  - It runs the real harvest path offline against the real models. Drafts
    (strategist → writer) join the harness in phase 4, the first phase that
    changes them.
  - An LLM judge scores against a fixed rubric: generic vs specific, author
    advantage present, ICP problem named, invented claims, and readability. A
    human spot-checks 10 of the results.
  - It stores the baseline for the current prompts, and every later prompt PR
    reports its delta.
- **0.3 Start registering the company** (D15). This is outside the code, but
  it is the critical path to phases 8 and 9. Draft the privacy policy and the
  use-case text alongside it.

Exit: the baseline eval numbers are committed, and no tenant-zero literals are
left in prompts or schema defaults. The lint catches them (add the rule).

### Phase 1: Data model (about 1 week)

New models (Prisma, with migrations, PostgREST access for n8n, and `clientId`
scoping):

- `IcpProfile` (one per tenant): who they are, their role, company type, top
  pains, decisions they are making, questions they ask, what triggers them to
  buy, and words they use.
- `ProfessionalMemory`:
  - `kind`: CURRENT_WORK, PAST_EXPERIENCE, OPINION, STORY, LESSON,
    ICP_QUESTION, EXPERIMENT or BUILD_IN_PUBLIC.
  - `content`.
  - `disclosure`: PUBLIC or GENERALIZE, following D4. There is no PRIVATE
    value, because private material is never stored.
  - `source`: BRAND_PAGE, WEEKLY_PULSE, IMPORT or EDIT_LEARNING.
  - Also `usedCount`, `lastUsedAt` and `isActive`.
- `ContentLane`: name, purpose (AUTHORITY, CREDIBILITY or DEMAND), a brief,
  a weight, a profile target (PERSONAL, COMPANY or BOTH), and an active flag.
  Existing tenants get defaults seeded from their current pillars.
- `Idea` gets new nullable columns:
  - Idea content: `sourceType`, `icpProblem`, `readerContext`,
    `authorAdvantage`, `whiteSpace`, `freshPerspective`, `vision`.
  - Links and evidence: `trustBasis String[]`, `memoryIds String[]`,
    `laneId`, `profileTarget`.
  - Scoring: `gateVerdict`, `gateReasons`, `scoreBreakdown Json`.

- **Remove PEER and BRIDGE (D14):**
  - Directives scoped to PEER or BRIDGE are deactivated, not deleted, and
    listed for the user to review.
  - Existing idea and asset rows keep their values as history.
  - New rows are always ICP.
  - The `audience_scope` filter in `Assemble Brand Context` becomes ALL/ICP
    only.
  - The strategist, harvest and refine prompts drop the audience choice.
  - The `AudienceLane` enum is dropped once nothing reads it.
  - Contract test: no prompt or code node mentions PEER or BRIDGE.

Exit: the migrations are applied, the Brand context API returns ICP, memory and
lanes, and the contract test for `Assemble Brand Context` covers the new fields.

### Phase 2: Brand page, Experience & Activity (about 1–1.5 weeks)

- An ICP editor built on `IcpProfile`, next to the existing audience directive.
  The directive is then derived from it.
- An **Experience & Activity** section: memory items grouped by kind, with a
  disclosure toggle and an "Minions used this in N ideas" count.
- **Brand completeness**: a score and at most 3 specific next prompts, such as
  "Add one failure story", "Name the question your ICP asks most".
- A generalization check on save: the LLM flags client names, figures and
  identifying details, and offers a generalized rewrite (D4).
- Onboarding is unchanged (D3), apart from optionally seeding one memory item
  from the setup answers.

Exit: tenant zero has an ICP profile and at least 10 memory items, entered through the UI.

### Phase 3: Harvester and refine rewrite (about 1.5–2 weeks)

This is the step with the most effect on quality.

- Inputs: ICP profile, the active memory, the lanes, market signals as
  *timing/context only*, recent ideas (for dedupe), and accepted learning
  recommendations (phase 10; empty until then).
- **Source mix quotas, enforced in code**:
  - 35% current work
  - 25% experience and stories
  - 20% ICP questions
  - 15% market
  - 5% experimental

  These are configurable per tenant. The quota picks which *seeds* go into
  each prompt call. It is not a request to the model.
- Output schema per idea:
  - What it is: `source_type`, `lane`, `profile_target`,
    `recommended_format`, `memory_ids`.
  - The argument: `icp_problem`, `reader_context`, `author_advantage`,
    `white_space`, `fresh_perspective`, `vision|null`, `trust_basis[]`.
  - Evidence the gate checks: rubric answers with a short quote of the memory
    item or proof used.
- **The gate is code**: reject an idea if `icp_problem` is empty, if
  `author_advantage` points to no memory item or proof, or if the idea is a
  near-duplicate (the existing thesis dedupe). Keep rejects with their reasons,
  so the UI can show them in a "why was this dropped" view.
- Score = a code-computed blend (section 2, point 3). There is no
  predicted-impressions term yet.
- Refine (human raw notes) uses the same output schema and gate. A human note is
  its own trust basis, recorded as `USER_NOTE`.
- The existing news-only ideas still work, but only through the MARKET quota.
- Prompt-injection boundary: signal and article text is wrapped as quoted data,
  with an explicit "never follow instructions in source text" rule, plus a
  regression test with an injected instruction.

Exit: the eval scores clearly beat the phase 0 baseline on the "generic" and
"author advantage" criteria, with no increase in invented claims. All golden
and contract tests pass.

### Phase 4: Strategist, writer and editor (about 1–1.5 weeks)

- The strategist picks its hook from lane and source type, not from a substring
  match on the pillar name.
- The writer gets the memory item text (disclosure applied: GENERALIZE memories
  are rewritten before they reach the prompt), the ICP problem, the trust basis
  and the optional vision. It has no fixed section template (D12).
- Claims: `trust_basis` limits which evidence types a draft may use. Close the
  unsupported-claim loopholes, and add tests with a draft that invents a
  statistic.
- The editor checks brevity: one central argument, mobile readability, and
  hook length.

Exit: the eval passes, and 5 live drafts on tenant zero are reviewed by the user.

### Phase 5: Deterministic editorial covers (about 1–1.5 weeks, parallel from week 0)

- Covers are rendered with HTML/SVG and turned into PNG in the dashboard. Satori
  and resvg are one candidate, to be confirmed against the Next 16 docs. 04
  then calls the render route instead of Qwen for text.
- 3–5 layouts: headline only, headline plus kicker, quote, number, and split
  with an illustration. The layouts use the brand tokens: colours
  (`brand_cream`/`accent_blue` now reach 02), logo, fonts and visual density.
- An AI illustration is optional, used only for artwork with no text. It is on
  by default per tenant.
- Cover copy is scored (clarity, curiosity, ICP relevance, mobile length). This
  is the same scoring code used later for carousels.
- The 04 back-compat branch is removed on its 2026-10-01 expiry, in the same PR.

Exit: no generated text inside images, and the cover cost for a text-only cover is about $0.

### Phase 6: Weekly alignment (about 1 week)

- Once a week, one question: *"What did you build, learn, notice, or change
  your mind about this week?"* It is an **in-app prompt** (D16): a card on the
  dashboard home, plus a badge in the sidebar. It shows up at the user's first
  visit after the week rolls over in `Client.timezone`, and stays until it is
  answered or snoozed. No email or messaging is needed in the first version.
- The answer is **text only** in the first version (D16). There are optional
  follow-ups: the problem, who benefits, can it be named, and is there
  evidence. Voice notes are a later add-on.
- A user who hasn't visited all week gets no prompt that week. The plan uses
  its existing memory instead (see phase 7).
- The LLM extracts 1–N `ProfessionalMemory` items. **The user confirms them**
  before they are saved, and the generalization check from phase 2 runs.
- Skip and snooze are allowed. Answers are never required.

Exit: tenant zero answers two weeks in a row, and at least one harvested idea traces back to a pulse memory.

### Phase 7: Content plan and scheduler (about 1–1.5 weeks)

- The Content Plan sits above `PostingSchedule`. It holds a primary objective
  and an optional secondary one, the lanes with weights, a date range, and the
  profile targets. The default is 3 posts a week (D5).
- The fixed slot plan is optional. Each slot can be pinned to a lane, as in the
  conversation's Mon/Wed/Fri example.
- **Every slot gets a post idea (D17).** The dispatcher fills a slot with the
  first of these that works:
  1. The strongest idea that passes the gate for the slot's lane.
  2. The strongest idea that passes the gate from any other active lane.
  3. A **targeted harvest** for that lane, run on demand for this slot: its
     seeds come from ICP questions and memory items that haven't been used
     recently.
  4. The best idea that ranks **below the bar**. Its draft is labelled "below
     the usual bar: <gate reasons>" and always needs review, even when
     `requireReview` is off.

  Steps 3 and 4 also show an in-app nudge to add an update, which targets the
  cause.
- **Look ahead.** The dispatcher checks the next 7 days of slots against the
  queue every day and runs step 3 early, so a slot is rarely filled at the last
  minute.
- The UI shows the upcoming week, with each slot's idea and how it was chosen
  (lane, other lane, targeted harvest, or below the bar).
- **Channels (D18):** each tenant chooses blog, LinkedIn, or both, with a
  per-post override on the draft. This builds on `ClientChannel.isActive`.
  03 already resolves each channel. The new parts are the plan-level choice and
  the per-post override. Generation adapts too: a LinkedIn-only tenant still
  needs the long draft that variants are derived from, but skips blog-only
  steps (slug/SEO, blog cover size).

Exit: two weeks of the plan run on tenant zero with every slot filled. A
below-bar fallback happens in fewer than 1 slot in 5, and each one is labelled
in review.

### Phase 8: Personal and company page (about 1.5 weeks; publishing to orgs needs the phase 9 approval)

- Schema: allow multiple LinkedIn targets. Split `channelKey` into
  `linkedin_personal` and `linkedin_org`, or add a `target` column and change
  the unique key. 03 then resolves the target per variant.
- A company voice profile: a small set of directives scoped to COMPANY.
- One idea produces two separate writer passes, each with its own strategy:
  - personal: lived perspective, opinion, process and lessons
  - company: education, capability, proof and announcements

  A similarity check rejects a company post that is only a light rewording of
  the personal one.
- Asset storage: `linkedinVariant` becomes per target. That means either a
  variants table or a second column. A table is the better long-term shape,
  because carousels come later.

Exit: one idea gives two clearly different posts, and each posts to its own target.

### Phase 9: LinkedIn app verification and analytics (the approval takes weeks; the build is about 1.5 weeks)

**Verify first** (the conversation's claims are unverified):

- Is Community Management API access still restricted to registered legal
  organizations?
- Does it have to be the **only product on its app**? I believe it does. If
  so, it needs a second LinkedIn app, alongside the current Sign In/Share one.
- The exact scopes:
  - `r_member_postAnalytics` for member analytics
  - `w_organization_social` for org posting
  - `r_organization_social` or the organization share statistics endpoint for
    org stats
- The review requirements (screencast, reviewer access).

**Blocked on the company registration (D15).** No legal entity exists yet, and
LinkedIn's Community Management review needs one. Registering the company is
the first step on the critical path for phases 8 (org posting) and 9. Start it
now: it is outside the code and probably the slowest item. The user is already
admin of the getminions.ai page, so the page-verification step is ready.

Application track, starting once the company is registered:

1. The legal entity details and a verified business email.
2. Privacy policy and terms pages on getminions.ai that match the use-case text.
3. A use-case statement that is identical everywhere (the draft is in the
   conversation).
4. The company page super admin verifies the app.
5. Development tier.
6. Build the integration.
7. Record the 9-step screencast.
8. Submit for Standard tier.

Build:

- `PostMetricSnapshot`: asset, target, post URN, `capturedAt`, `ageBucket`
  (24h, 72h, 7d or 30d), impressions, reach, reactions, comments, reposts,
  saves, sends, link clicks, profile views and followers gained, plus the raw
  JSON.
- A snapshot job. The options are a new n8n workflow `05_metrics_sync` (added
  to the manifest with a schedule reason) or a dashboard cron. My pick is n8n,
  to stay consistent.
- Normalization: impressions per follower, engagement per impression, and each
  post against the tenant's rolling median.
- The Telemetry page is split in two: **Performance**, which is new, and
  **Production**, which is the existing metrics.
- Disconnect: revoke the token and explain what data is kept and what is
  deleted.

Exit: Standard tier is approved, and real snapshots come in for tenant zero.

### Phase 10: Learning loop (about 1.5 weeks; needs phase 9 and about 15 measured posts)

- A weekly analysis groups the measured posts by lane, source type, hook
  archetype, format and posting time, relative to the rolling median.
- Each recommendation carries evidence (n posts, the multiple, an example post)
  and can be accepted, rejected, accepted for 1 month, or saved permanently to
  the plan (D8).
- Accepted recommendations adjust lane weights and quotas, and feed the
  harvester as a "lessons" input.
- **Authority floor**: never recommend a lane or topic whose ideas fail the
  gate, whatever its impressions.
- Turn on the predicted-impressions term in the idea score only once there is
  enough data.
- An anti-repetition rule: cap how many posts in a row can share a topic or
  hook.

Exit: the first recommendation has been accepted by the user and is visible in the next harvest.

### Later: carousels

- One LLM call produces the slide plan and all the copy.
- The slides are rendered with the phase 5 renderer. An image call is optional
  and at most one per carousel.
- The budget is ≤ 5–10 BDT, about $0.04–0.08. Check the rate when building.
- Needs: the variants table from phase 8, and the LinkedIn document or
  multi-image post API. Verify which one.

### Dependency graph

```
P0 baseline ─┬─> P1 model ─> P2 brand page ─> P3 harvest ─> P4 writer ─> P7 plan ─> P10 learning
             │                    └──────────> P6 weekly pulse ───────────┘            ^
             ├─> P5 covers (parallel)                                                  |
             └─> LinkedIn application ─────────────> P9 analytics ─> (≈15 posts) ──────┘
                                                └──> P8 company page (org posting)
```

**Milestone A, "Authority MVP"** (P0–P4 plus P5, about 6–8 weeks): better ideas
and drafts, and clean covers. Needs no LinkedIn approval. **Ship this first.**
Milestone B (P6–P8) makes it a system people keep using. Milestone C (P9–P10)
closes the loop, and depends on LinkedIn.

## 6. Cost envelope (to re-measure in P0)

| Stage | Added per post |
|---|---|
| Harvest with memory + rubric (larger context) | +$0.002–0.005 per idea batch |
| Second writer pass for the company page | +about $0.01 when enabled |
| Deterministic cover | −(current Qwen cover cost) |
| Weekly pulse extraction plus transcription | about $0.01 per user per week |
| Metrics sync | no LLM cost; API calls only |

## 7. Risks

| Risk | Mitigation |
|---|---|
| The company isn't registered yet, or LinkedIn denies or delays Standard tier | Milestones A and B don't depend on it. Personal posting keeps working on `w_member_social`. Start registering the company now. |
| Users never fill in Experience & Activity | Completeness prompts, the weekly pulse, and learning from edits (a user's edits to a draft become candidate memories they confirm). If there is no memory, more slots fall back to the labelled below-bar draft (D17), and the nudge to add an update gets more prominent. |
| The gate starves the queue | Every slot is still filled (D17): other lanes first, then a targeted harvest, then a labelled below-bar draft. Track how often the below-bar fallback happens, and nudge the user for updates. |
| The LLM judge in the eval is biased | Keep the rubric fixed, spot-check with a human, and track the numbers as deltas rather than absolute values. |
| Schema changes break n8n PostgREST writes | Additive migrations, contract tests on every new field, and the existing lint rules. |
| Scope creep | Each phase has an exit criterion. Nothing in Milestone B starts before Milestone A's eval shows a gain. |

## 8. Open questions

Q1–Q6 were answered on 2026-09-23 and are recorded as D14–D18. The only
external blocker is registering the company (D15).

## Progress

### Phases 0 and 1 — built 2026-09-23

**Done in code** (tests, lint, `next build` and the docs check all pass):

- **Tenant-zero leftovers removed.**
  - A missing `client_id` now fails the run instead of defaulting to tenant
    zero (`Resolve Client ID` in 01, `Generate run_id` in 02).
  - Trade and pillar fallbacks are neutral in n8n, the webhooks and the UI.
  - The new lint rule `tenant-literal-fallback` keeps them out, and a test
    keeps the literals out of prompts and schema defaults.
  - Deliberate identity checks (tenant zero's hosted blog, founder byline)
    stay.
- **Eval harness** in `src/test/eval/` (`npm run eval`):
  - It runs the real 01 harvest path, and a judge model answers a fixed rubric
    for each idea.
  - The judge proved too lenient, so the checks that matter are done in code:
    - Author advantage must quote the idea and share at least 3 content words
      with the memory item it cites.
    - Any number of 10 or more (or any %) that appears in no input counts as
      invented.
  - `--rescore` re-applies these checks to stored verdicts without calling any
    model.
  - The baseline is `src/test/eval/results/2026-09-23-baseline.json`.
- **Data model** (`prisma/sql/2026-09-23-authority-foundation.sql`, with
  `prisma/schema.prisma` kept identical):
  - Tables `icp_profiles`, `professional_memories` and `content_lanes`, with
    RLS on and no policies.
  - The flywheel columns on `ideas`.
  - Neutral defaults for ideas, assets and blogs.
  - 4 default lanes per tenant, and an ICP seeded from the tenant's AUDIENCE
    directives.
  - PEER/BRIDGE directives are deactivated and listed.
  - Tenants created later get the same defaults on first read
    (`ensureAuthorDefaults`).
- **`/api/brand/context`** now returns `icp`, `professional_memory` and
  `content_lanes`.
- **Refine** assigns every idea one of the tenant's lanes, with `lane_id` saved
  on the idea. Its pillar comes from the shared angle library, instead of 4
  pillars hardcoded from tenant zero.
- **One ICP everywhere:**
  - Directive writes reject PEER/BRIDGE.
  - The Ideas page no longer offers an audience choice.
  - Presets no longer seed a second audience.
  - The parse nodes label every idea ICP.
  - `Assemble Brand Context` applies only ALL/ICP rules.

**Baseline findings (what phase 3 has to move):**

| % of 27 ideas | overall | minions | keystone | ledgerline |
|---|---|---|---|---|
| authority_pass | 15 | 0 | 33 | 11 |
| author_advantage | 15 | 0 | 33 | 11 |
| generic | 26 | 33 | 0 | 44 |
| invented_facts | 26 | 44 | 11 | 22 |

- The current harvest prompt never sees the author's memory. So the 15%
  author-advantage figure is coincidental overlap, and it is the noise floor
  for that metric.
- `icp_problem` and `beyond_source` came out at 100% for every tenant, so the
  judge does not discriminate on them. Don't cite them as evidence of a gain.

**Phase 1 re-run** (`2026-09-23-phase1.json`):

| % of 27 ideas | authority_pass | author_advantage | generic | invented_facts |
|---|---|---|---|---|
| baseline | 15 | 15 | 26 | 26 |
| phase 1 | 4 | 4 | 30 | 22 |

- The prompts still ignore memory, so no gain was expected and none showed up.
- The gap between the two runs of the same prompt is the **run-to-run noise:
  about ±10 points at 27 ideas**. Phase 3 should run with `--runs 5` or more,
  and should claim only gains well above that noise.

**Deploy order** (the dashboard reads the new tables, and a missing table makes
the harvester refuse to run):

1. Apply the SQL file.
2. Push the dashboard.
3. Push n8n 01 and 02.

### Phase 2 — built 2026-09-23

**Brand page › Audience & Experience** (`src/components/brand/ExperienceTab.tsx`):

- **ICP editor** (`GET/PUT /api/brand/icp`): who they are, role, company,
  pains, decisions, questions, triggers and vocabulary.
  - Each save rewrites the one AUDIENCE directive the current prompts read
    (`DIR-ICP-<client>`, in `src/lib/icpDirective.ts`) and retires the old
    audience tags.
  - The Overview card now shows the ICP and links to this editor.
- **Experience & activity** (`/api/brand/memory`, `/api/brand/memory/[id]`):
  - Items are grouped by kind, and each has a Public/Generalize toggle, an
    on/off switch, edit and delete.
  - Each item shows "used in N ideas", counted live from `ideas.memory_ids`.
    It reads 0 until the phase 3 harvester writes that field.
- **Generalization check** (`POST /api/brand/memory/check`,
  `src/lib/ai/memoryCheck.ts`):
  - Code catches the certain cases: contact details, keys and passwords
    always block; money and links count only under Generalize.
  - The model adds names, places and anything confidential. It sees the item
    as fenced data, and a span it flags is kept only if it really occurs in
    the text.
  - The page offers "Use this version", with the specifics removed.
  - The server re-applies the blocking code checks on every save.
  - The prompt is listed in `n8n/architecture.html`.
- **Brand completeness** (`GET /api/brand/completeness`,
  `src/lib/brandCompleteness.ts`): a score, plus at most 3 next steps, each
  linking to its tab. The card sits at the top of the Brand page on every tab.
- Onboarding is unchanged (D3).

**Exit criterion still open:** tenant zero needs its ICP and at least 10 real
experience items, entered through the page. Only the author can write them.

### Phase 3 — built 2026-09-23

**The harvest plan: the source mix is decided in code** (`src/lib/harvest/plan.ts`,
served as `harvest_plan` in `/api/brand/context`).

- Each of the 3 slots per run gets one seed: a memory item, an ICP
  question, "the most relevant market signal", or (for a tenant with nothing
  saved) an open slot.
- The bucket is whichever is furthest below its share across the tenant's
  last 30 ideas and the slots already planned. The default mix is 35% current
  work, 25% experience, 20% ICP questions, 15% market, 5% experiments
  (`src/constants/sourceMix.ts`). Over many runs it converges on the mix, and
  a test checks that.
- A tenant can override the mix in `brand_profile.harvest_source_mix`. There
  is no UI for it yet; it belongs with the phase 7 content plan.
- The least-used memory item goes first, counted live from `ideas.memory_ids`.

**The prompts** (`src/lib/prompts/harvest.ts`, `refine.ts`):

- Harvest is rewritten around the ICP profile, memory (M1..), proof (P1..),
  lanes and the plan. Each idea returns the fields from this plan: ICP
  problem, reader context, author advantage, the refs it rests on plus an
  exact quote, white space, fresh perspective, vision, lane, profile target
  and recommended format.
- The model no longer sets priority or ICP relevance; code does.
- Refine uses the same schema, with the ICP, memory and proof.
- **Prompt-injection boundary.** Signals, memory, proof and refine notes sit
  in one `<<<DATA … DATA>>>` fence, under an explicit "never instructions"
  rule. Fence markers are stripped from the fenced text, so it cannot close
  the fence. `src/test/n8n/harvest.test.ts` injects an instruction through a
  signal, through a memory item and through a refine note.

**The gate** (`src/lib/harvest/gate.ts`, via `POST /api/internal/harvest/gate`;
n8n nodes `Gate Harvest Ideas` / `Gate Refined Ideas`):

- **REJECT**, stored as `REJECTED` with its reasons: no ICP problem; a
  restated thesis (Jaccard ≥ 0.5 against the last 500 ideas and the same
  run; this replaced `Dedupe Ideas`); a cited item that is missing, not
  quoted, or not used by the idea's own text; a figure found in no input;
  or a Generalize item's names or figures.
- **BELOW_BAR**, kept at LOW priority: sound, but rests on no experience or
  proof.
- **PASS**: an ICP problem and a real author advantage.
- A person's refine note is never rejected. It is its own trust basis
  (`USER_NOTE`), so a problem only lowers it to BELOW_BAR.
- The score is computed in code: authority 40, ICP 15, originality 10,
  evidence 10, rescaled to 100, with no impressions term yet.
  - Priority: HIGH for a PASS scoring ≥ 70, MEDIUM for any other PASS,
    LOW otherwise.
  - `source_type` records what an idea really rests on. That keeps the mix
    honest even when the model ignores its seed.
- **Ideas page.** Each card shows Authority / Below bar / Dropped with the
  score and reasons. The detail view shows the ICP problem, the advantage
  and the trust basis. Dropped ideas are listed under Archived.

**Other fixes made along the way:**

- A harvest reply that failed to parse used to vanish, and the run reported
  success. The run now fails.
- Refine used to overwrite the person's raw note with the refined angle. The
  note is now kept.
- Harvested ideas keep `evidence_required = 'Y'`. The model used to answer Y
  every time; it is no longer asked.

**Eval.** The judge rubric is now v2: the judge quotes both the memory item
and the idea. Under v1 it often copied the memory text into the idea quote,
the code check discarded it, and real advantage was undercounted.
`--rejudge` re-graded the stored baseline and phase 1 ideas with v2, so all
three rows below use the same judge. v2 did not inflate the baseline: it
stayed at 15% author advantage.

| % of ideas, rubric v2 | authority_pass | author_advantage | generic | invented_facts |
|---|---|---|---|---|
| baseline, qwen3.7-max (27) | 15 | 15 | 33 | 30 |
| phase 1, qwen3.7-max (27) | 7 | 7 | 33 | 22 |
| phase 3, qwen3.7-max, all ideas (45) | 73 | 78 | 4 | 4 |
| **phase 3, qwen3.8-max, all ideas (45)** | **67** | **67** | **4** | **0** |
| phase 3, qwen3.8-max, what the gate kept (44) | 68 | 68 | 2 | 0 |
| **phase 3 + "never embellish experience" rule (2026-09-24), all (45)** | **93** | **93** | **2** | **0** |

- **Exit criterion met.** Generic and author advantage clearly beat the
  baseline, invented claims fell, and all golden and contract tests pass
  (264).
- **Model switch (2026-09-24, at the user's request).** Harvest, craft and
  strategist moved from `qwen3.7-max` to `qwen3.8-max`, which has 1M free
  tokens on the QwenCloud account until 2026-11-05. It is set to "free quota
  only", so calls fail once the quota is used up. The committed
  `2026-09-23-phase3.json` is the final qwen3.8-max run.
  - Across three qwen3.8-max runs, author advantage came out at 87, 82 and
    67. That spread is run-to-run noise at 45 ideas; every run is far above
    the baseline.
  - qwen3.8-max writes internal labels ("Signal 14", "M5") into idea text,
    and those would leak into drafts. The prompt now forbids them on each
    field. The gate strips bracketed citations and rejects any label left in
    running text. That cut label rejects from 11 of 45 to 0.
- **Automatic model fallback (2026-09-24, at the user's request).** Every
  chat call from 01 and 02 now goes through
  `POST /api/internal/llm/chat/completions`, which calls DashScope and walks
  a chain when a model is unavailable (free quota used up, not offered, or
  rate-limited). The chain for `qwen3.8-max` is deepseek-v4-pro, glm-5.2,
  deepseek-v3.2, and finally the paid qwen3.7-max (`src/lib/ai/modelChain.ts`).
  - Other errors pass through unchanged, so a bad request is never hidden
    behind a different model.
  - The `x-model-used` response header names the model that answered.
  - The eval still calls DashScope directly, so it always measures the
    primary model.
- The first rubric-v2 runs are not committed: the prompt and gate changed
  after them. They are:
  - qwen3.7-max, the row above;
  - two qwen3.8-max runs from before the label fix.
- The gate kept 98% of ideas. Of the ideas the judge rates as authority, the
  gate passes 100%. The judge rates 68% of the gate's PASSes as authority,
  which makes the gate the more lenient of the two. The human spot-check below
  is where that gets tightened.
- The eval does not feed recent theses back between its runs, so themes
  repeat across the 5 runs. Production passes them, and the gate dedupes.

**Deploy order.** The dashboard reads the new column, and a missing column
makes the context degraded, so the harvester refuses to run:

1. Apply `prisma/sql/2026-09-23-harvest-gate.sql`.
2. Push the dashboard.
3. Push n8n 01.

**Still open:**

- A human spot-check of 10 live ideas on tenant zero, once it has its
  experience items (the phase 2 exit).
- UI for the per-tenant source mix (phase 7).

### Phase 4 — built 2026-09-24

**What the drafter now knows** (`POST /api/internal/drafts/context`,
`src/services/draftContext.ts`; the new 02 node `Fetch Author Context`):

- The idea's ICP problem, reader context, author advantage, white space,
  fresh perspective, vision, lane and format.
- The experience items the idea cites, inactive ones excluded.
  - GENERALIZE items arrive only as a lesson-only rewrite: the memory
    check's rewrite, used only if code confirms no name, figure or link
    survived, otherwise redacted in code (`src/lib/drafts/generalize.ts`).
  - The rewrite is cached on the row (`generalized_content`), keyed by a hash
    of the text it came from.
- The ICP and the author's standing.
  - Found along the way: 02 read `writer_expertise_guidance` from a
    brand_profile query that never selected it, so the standing never
    reached a single draft.
- An idea from before phase 3 gets `found: false` and drafts as before.

**Strategist, writer, editor** (`src/lib/prompts/strategist.ts`, `writer.ts`,
`editor.ts`):

- **Hook.** Chosen in code from the source type and lane (`hookFor`,
  `src/lib/drafts/strategy.ts`):
  - an author scene for past experience;
  - "work in progress" for current work;
  - a position for an opinion;
  - "the question" for ICP questions;
  - "what changed" for signals;
  - "the decision" for DEMAND lanes.

  Older ideas match their angle exactly. The pillar substring match is gone:
  "Systems Architecture" no longer silently becomes an INVERSION.
- **Content modes.** STORY needs lived experience or the author's own note.
  CASE_NOTE needs proof or experience. A mode the evidence cannot carry is
  moved in code to the nearest honest one.
- **Writer.** One argument, carrying the author's specific detail. Evidence
  rules come from the trust basis: first person only about the listed
  experience, never embellished, and none at all when the idea rests on no
  experience.
  - There is no required section list (D12).
  - POST is 250–450 words; ARTICLE is 350–800.
- **Editor.** Keeps one central argument, cuts for mobile (hook ≤ 2 sentences
  and 200 characters), and never adds facts.

**The draft check** (`POST /api/internal/drafts/check`, `src/lib/drafts/check.ts`;
the 02 node `Check Draft` feeds `Parse Claims and Gate`):

- **Loophole closed:** the old gate saw only the claims the editor chose to
  extract, and passed a hedged "could cut failures by 40%" as OPINION.
  Figures are now found in code, and any number the draft states that
  appears in no input BLOCKS it. Years are not statistics.
- **BLOCKED** also for a Generalize item's names or figures, and for a
  customer result with no approved proof or experience item behind it.
- **N (needs review)** for an unbacked claim, or for first-person experience
  ("we built", "our clients") on an idea that rests on none.
- **Claims are sourced** to approved proof, to the author's own experience,
  or to a supplied signal. Signals now keep their excerpt (01's Attach Source
  URLs used to keep only the title).
- **Paragraph reflow.** A paragraph over 3 sentences is split at a sentence
  boundary in code, and never inside a run of short fragments. The prompts
  asked for this and the models broke it in about one paragraph in three.
- **Review notes.** The reasons and readability notes go to
  `assets.review_notes` and show in the Editorial page's Claims Gate panel.

**Test drafts skip the cover image:** a trigger with `skip_hero: true` never
reaches 04. The asset's cover is FAILED ("Skipped: test draft") and can be
regenerated.

**Other bugs fixed:**

- A strategist, writer or editor reply that failed to parse flowed on as an
  empty draft, which passed the claims gate, so an empty draft could be saved
  as claims-OK. The models regularly put raw line breaks inside JSON strings.
  The parse nodes now repair that (`src/lib/modelJson.ts`), and fail the run
  when a reply is still unusable.
- Every asset was filed under pillar "Operations", with tags
  ["ICP", "Operations"]. They now carry the idea's pillar.

**Draft eval** (`npm run eval:drafts`, `src/test/eval/drafts.ts`,
`draftRubric.ts`):

- 9 fixed ideas (`draft-ideas.json`, 3 per corpus tenant) go through the
  real 02 nodes, then a judge answers the draft rubric. Code checks its
  quotes, and code measures readability.
- The baseline is the pre-phase-4 prompts, with the parse fix applied so they
  could run at all.

| 9 drafts | draft_pass | author_advantage | invented | claims_ok Y | hook over 210 chars | paragraphs over 3 sentences | words |
|---|---|---|---|---|---|---|---|
| baseline | 44 | 67 | 33 | 0 | 56 | 2.3 per draft | 319 |
| **phase 4 (final)** | **67** | **89** | 33 | **78** | **0** | **0** | 263 |

- **Across the three phase 4 runs:**
  - author advantage came out at 78, 67 and 89;
  - draft_pass at 78, 67 and 67;
  - claims-OK at 11, 56 and 78 (the reflow and source matching landed between
    runs).

  At 9 drafts, one draft is 11 points, so read the direction, not the
  decimals.
- **"Invented" is 33% in the final run, but none of it could publish.**
  - One draft stated figures found in no input, and the check BLOCKED it.
  - The judge's other two flags are reasoning ("they arrive at the first
    meeting skeptical") and a proposed rule of thumb ("three straight
    quarters"), not stated facts.
  - Every draft with an invented number or story in any run was BLOCKED or
    sent to review.
- The harvest prompt gained a rule after the draft ideas were made: never add
  events, failures or results to an experience item. Some eval ideas had
  embellished "we are building X" into "our first version of X failed".
  Re-running the idea eval with the rule gave 93% authority_pass (the last
  row of the phase 3 table); the committed `2026-09-23-phase3.json` is that
  run.

**Deploy order:**

1. Apply `prisma/sql/2026-09-24-draft-check.sql`.
2. Push the dashboard.
3. Push n8n 02, then 01 (the signal excerpts).

**Exit criterion still open:** 5 live drafts on tenant zero, reviewed by the
user. They need tenant zero's experience items. Until then its ideas carry no
experience and draft on the older path.

### Security fixes found along the way (2026-09-23)

- **The public site served other customers' posts.** getminions.ai/blog listed
  8 posts from 3 other workspaces, under Minions founder bylines. The site now
  reads only tenant zero's posts, and those 8 URLs return 404.
  - The dashboard now credits each workspace's posts to its own brand.
  - Blog upserts, deletes and edits are scoped to the workspace, so a shared
    slug can't overwrite another workspace's post.
  - `prisma/sql/2026-09-23-security-lockdown.sql` re-credits the old posts.
- **Anyone with the public anon key could read every workspace's data.**
  "Public read" RLS policies (USING true) covered ideas, assets, claims and
  brand_directives. Blogs is now public only for tenant zero's published
  posts. This is in the lockdown SQL.
- **The vault RPCs were callable with the anon key.** `get_channel_secret` and
  `create_channel_secret` were SECURITY DEFINER and executable by anon.
  Revoked in the lockdown SQL.
- **The webhook secret was public.** Its value was committed to the public
  minions-ai repo, and it authenticated the dashboard's internal API.
  - The dashboard now reads a new `MINIONS_WEBHOOK_SECRET`.
  - The public site refuses the old value.
  - n8n passes the secret only through its credential, to fixed URLs.
- **All four n8n trigger webhooks were unauthenticated.** They now use header
  auth.
- **Three unused webhooks were removed.** They weren't tenant-aware and could
  create unowned rows.
- New lint rules `webhook-without-auth` and `secret-in-payload` keep these
  from coming back.

