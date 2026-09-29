# Decision log

The most important product decisions: what the product does for users and
the business, and why. Technical and implementation choices stay out; their
reasons go in the commit message. If a later decision reverses an earlier
one, add a new entry and mark the old one superseded.

Product-strategy decisions that belong to the authority flywheel roadmap keep
living in their own D-table in
[authority-flywheel-plan.md](../product/authority-flywheel-plan.md); link to
the relevant Dn from here rather than duplicating it.

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

## 2026-09-29 — Carousels come in three designs; the model picks one per post

**Decision:** The pages after a carousel's cover come in three designs:
EDITORIAL (the original), BOLD and MINIMAL. The model picks one to suit each
post's tone, alongside the structure it already picks. Every design keeps the
same page grid and fonts, and uses the workspace's brand colours. Carousels
made before this keep EDITORIAL. Reviewers can't change the design yet.
**Why:** every carousel from every tenant had the same frame, so decks looked
interchangeable across posts and brands. Varying colour and chrome only (never
geometry) means a plan that fits one design fits all of them, so no new fit
failures.
**Alternatives considered:** fonts and frame styles chosen per brand. That is
the planned next step (see phase 11 "Later" in
[authority-flywheel-plan.md](../product/authority-flywheel-plan.md)), deferred
for now.
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

## 2026-09-27 — Phase 7 exit started on tenant zero

**Decision:** 00b reactivated; tenant zero moved to Mon/Wed/Fri 09:00
(America/New_York) with Automatic drafting on and review still required.
It is the only workspace with drafting on. The exit clock (two weeks with
every slot filled, plan D17) starts with the first Monday slot.
**Why:** the user approved all three steps. Review stays on so a below-bar or
unbacked draft can't post before the ICP and experience items are filled in.
**Status:** active

## 2026-09-28 — Workspaces default to Bangladesh time

**Decision:** `clients.timezone` defaults to `Asia/Dhaka` (column default and
`DEFAULT_TIMEZONE` in `src/constants/config.ts`, used by every fallback).
Tenant zero and bsse1610's workspace were moved to Asia/Dhaka and marked
confirmed; other existing workspaces keep New York.
**Why:** the user asked for Bangladesh time as the default; the team works
from Dhaka. The Weekly Pulse card still offers the browser's timezone until a
user confirms one, so a workspace elsewhere is not stuck on Dhaka.
**Trade-off:** 09:00 in Dhaka is 11 pm in New York the night before, and both
workspaces write for US and Dubai brokerages. The posting time can be moved in
Settings › Schedule.
**Status:** active

## 2026-09-28 — Tenant zero's brand rewritten for real estate

**Decision:** tenant zero's brand profile, ICP, directives and experience
items were rewritten from getminions.ai (now real-estate voice agents) and
the founder's LinkedIn profile. The ICP matches bsse1610's workspace. HVAC and
regional rules are off, not deleted. The "sub-1.8s" claim was replaced with
the measured demo-line figures (median 1.38s, p90 2.51s, 5 Sep 2026).
**Why:** the brand still described US home-services trades, so ideas and
drafts targeted the wrong buyer. Experience items come only from published
LinkedIn posts and the website, never invented.
**Rejected:** carrying over the website's SOC 2, uptime-SLA and "bank-level"
encryption lines; there is no evidence for them, so a directive now forbids
them in posts.
**Status:** active

## 2026-09-29 — Blog off: the Studio hides the article

**Decision:** when a workspace has the blog channel off, the Editorial Studio
hides the article editor. The cover and carousel stay at the top, with the
social post under them (putting the post first pushed them out of sight).
**Why:** a LinkedIn-only user (Miskat, onboarded 2026-09-29) saw a full blog
article with "Article Headline & Title" above his post and could edit it
believing that was what goes out. The article is never published for him.
**Trade-off:** the article is still the source the cover and carousel are
made from, so a blog-off user can no longer edit that source directly; the
post and carousel pages stay editable.
**Status:** active
