# Decision log

Every decision made during development — product, architectural, or
technical — that isn't obvious from reading the code goes here, in order,
never edited or deleted after the fact. If a later decision reverses an
earlier one, add a new entry and mark the old one superseded; don't rewrite
history.

This file is append-only. Product-strategy decisions that belong to the
authority flywheel roadmap keep living in their own D-table in
[authority-flywheel-plan.md](../product/authority-flywheel-plan.md) — link to
the relevant Dn from here rather than duplicating it. Everything else
(architecture, library choices, schema shape, trade-offs, things rejected
and why) goes here.

## Format

Each entry:

```
## YYYY-MM-DD — Short title

**Decision:** what was decided, one or two sentences.
**Why:** the reasoning or constraint that drove it.
**Alternatives considered:** what else was on the table and why it lost (omit if none).
**Status:** active | superseded by [link] | reverted
```

Keep entries short. This is a log, not a design doc — if a decision needs
paragraphs of justification, write that in `docs/product/` or a code comment
and link to it here.

---

## 2026-09-25 — Establish this decision log

**Decision:** Every non-obvious development decision must be recorded here
as it's made, not reconstructed later from git history or memory.
**Why:** AI-driven development produces many small irreversible-in-practice
choices (schema shape, library picks, trade-offs) across sessions and
agents; without a running log, later sessions re-litigate settled questions
or silently drift from them.
**Status:** active

## 2026-09-25 — Covers lock at publish; a redraw deletes the cover it replaces

**Decision:** A drawn cover can be redrawn only until the draft goes out
(asset status PUBLISHED, any `*_published_at`, or a blog row for it). Each
redraw still uploads under a new timestamped key, and after the new cover is
saved the previous `covers/…` object is deleted from R2. Uploaded photos and
paid AI images are never deleted; a failed delete is logged, never fails the
redraw.
**Why:** every redraw left the old PNG (~100 KB) in R2 forever. Before
publishing, nothing public links to the old file, so deleting it is safe;
after publishing, the blog page and posts point at that exact URL, so the
cover must stay fixed. The blog row check is needed because the asset's own
status lags behind a live post (see `live_blog_url`).
**Alternatives considered:** overwrite one fixed key per draft — rejected,
Cloudflare's cache and browsers would keep showing the old picture;
a periodic sweep of unreferenced objects — more moving parts for the same
result.
**Status:** active

## 2026-09-25 — Phase 7 scope as the user set it; scheduling one reviewed post

**Decision:** the user answered phase 7's four questions (see the plan's
"Phase 7 — building" entry): a slot's time stays the **drafting** time; after
review a post goes out **now or at a picked date and time** (not tied to plan
slots); a slot's draft follows the workspace's `requireReview`; the slot filler
is built but stays **off**. A scheduled post is `assets.status = SCHEDULED`
with `scheduled_for`; `POST /api/internal/schedule/release-due`, the first
step of 03_review_publisher's existing 5-minute poll, flips due posts to
PUBLISHED and puts them on the blog, and the same poll broadcasts them.
**Why:** 03's poll is already active and already publishes any
PUBLISHED-and-unbroadcast asset, so scheduling needed one new step, not a new
scheduler — and the 00b dispatcher stays off as the user asked. The flip is a
compare-and-set, so overlapping polls release a post once. The picked time is
read in the workspace's timezone, not the browser's.
**Alternatives considered:** a Vercel cron for the release — Hobby crons run
daily at most; publishing straight from a new n8n schedule — a second poller
for the same job. Tying scheduled posts to plan slots — the user chose not to.
Posts go out up to 5 minutes after their time (the poll interval); accepted.
**Status:** active

## 2026-09-27 — The slot filler lives in the dashboard; n8n only carries the idea id

**Decision:** Which idea fills a slot is decided in `src/lib/plan/fill.ts`
(pure, tested) and applied by `src/services/contentPlan.ts`. The 00b
dispatcher's existing call to `/api/internal/schedule/eligible-tenants` runs
the look-ahead and returns the chosen `idea_id` for a due slot; 00b passes it
to 02, whose Select Target already drafts an explicit idea. A targeted
harvest narrows `content_lanes` in `/api/brand/context` (read only by 01) to
the slot's lane while it runs. The below-bar label and review-off
auto-publish happen when the draft's cover settles (`/api/internal/covers`,
`/api/internal/assets/hero`).
**Why:** decisions stay in code (plan principle), and no change was needed to
01 or 02 — 02 is the largest workflow and the n8n API currently times out on
large reads. 02 cannot auto-publish on its own anyway: its `autoPublish`
requires `heroIsPermanent`, which is always false since covers moved out of
02, so "require review: off" had silently done nothing.
**Alternatives considered:** filling slots inside 02's Select Target — the
logic would live untested in n8n; a new n8n schedule for the look-ahead — 00b
already polls every 5 minutes and stays the single dispatcher.
**Trade-offs accepted:** if the chosen idea is claimed between the pick and
02's run, 02 falls back to its own choice; the slot is then marked EMPTY
after 30 minutes and the draft is untracked. Rare: the pick only takes
unclaimed ideas.
**Status:** active

## 2026-09-27 — Auto-publish with review off applies to slot drafts only

**Decision:** with `require_review` off, only a draft the content plan made
for a slot publishes on its own, once every check passed and its cover is
ready. Drafts started by hand and below-bar drafts always wait.
**Why:** the user chose "follow require review" for a slot's draft
(2026-09-25). Auto-publish had been dead code (see above), so turning it on
for every draft would suddenly post hand-started test drafts — the test
workspace has review off and LinkedIn connected.
**Status:** active

## 2026-09-27 — Cadence-only drafting retired; new workspaces default to 3 a week

**Decision:** `eligible-tenants` returns only workspaces with the slot filler
on (`posting_schedules.filler_enabled`), each with the idea to draft. The old
behaviour — draft whatever 02 picks at every cadence tick — is gone. New
schedules default to Mon/Wed/Fri 09:00 (D5); existing ones are unchanged.
**Why:** 00b has been off since 2026-09-21, so nothing depended on it, and
turning it back on would otherwise have started drafting for all six
workspaces with an active schedule.
**Status:** active

## 2026-09-27 — Per-post channels: an override list on the asset

**Decision:** `assets.channels` (empty = the workspace's active channels)
limits one post (D18). The credential route answers "not active" for a
channel the post is kept off when 03 passes `assetId`; tenant zero's hosted
blog and the dashboard's own blog write check it too. X is not offered: it
has no publisher.
**Why:** 03 already skips a channel that resolves inactive, so the override
needed one query parameter per channel node, not new branches.
**Status:** active

## 2026-09-27 — Correction: the test workspace has review ON

The "auto-publish applies to slot drafts only" entry above says the test
workspace has review off. It has review **on** and its schedule is paused;
LinkedIn is connected. The decision stands for the reason given: turning
auto-publish on for every draft would post hand-started drafts in any
workspace with review off.
**Status:** active

## 2026-09-28 — One switch for automatic drafting; "Schedule active" retired

**Decision:** Each workspace has one switch, "Automatic drafting"
(`filler_enabled`), at the top of Settings › Schedule. The separate
"Schedule active" pause is gone from the UI; `is_active` stays in the table,
is set true on save and when drafting is switched on, and the migration set
the one paused row back to true (its drafting was off).
**Why:** A workspace drafted on its own only when three switches in three
places were all on (00b in n8n, "Schedule active", slot filling). Six
workspaces showed "Schedule active: on" while nothing drafted. `is_active`
also gates the week preview, so mirroring it to the drafting switch would
have blanked the preview whenever drafting was off.
**Alternatives considered:** dropping the `is_active` column (touches the
scheduling maths and every caller for no user-visible gain).
**Status:** active

## 2026-09-28 — Job state from check-ins, not from n8n's active flag

**Decision:** Each background job checks in (`job_heartbeats`) from the
dashboard route it already calls on every run: 00 → harvest-slot, 00b →
eligible-tenants, 03 → release-due, 01 → brand/context, 02 → drafts/context,
04 → assets/hero. The sweeper and the error alert never call the dashboard,
so each got a "Check In" node posting to `/api/internal/heartbeat`. A timed
job is "running" while its last check-in is within three of its intervals.
The platform-admin Automations page and the Settings › Schedule status line
("On, but the drafting service isn't running") read these.
**Why:** a check-in is what actually ran; an active flag can be on while a
workflow errors on every run. It also needs no n8n API key in the dashboard.
**Alternatives considered:** reading workflow `active` and last execution
from the n8n API (the key exists only locally, and large GETs hang).
**Status:** active

## 2026-09-27 — Phase 7 exit started on tenant zero

**Decision:** 00b reactivated; tenant zero moved to Mon/Wed/Fri 09:00
(America/New_York) with Automatic drafting on and review still required.
It is the only workspace with drafting on. The exit clock (two weeks with
every slot filled, plan D17) starts with the first Monday slot.
**Why:** the user approved all three steps. Review stays on so a below-bar or
unbacked draft can't post before the ICP and experience items are filled in.
**Status:** active
