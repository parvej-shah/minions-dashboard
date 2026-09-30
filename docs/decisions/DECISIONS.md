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

## 2026-09-30 — The brand brief is a lesson, one question per screen

**Decision:** The setup wizard asks one question per screen: what you want to be known for, who it's for, how deep your experience is, where you work (skippable), and your voice. The flow ends on a "your brief is ready" screen where you choose review-first or auto-publish. Every answer can be one tap on an example, and each screen has a single CONTINUE button that confirms a good answer.
**Why:** The old three-step form put up to eight fields on one screen, which read as paperwork. The UX bar is a lesson app like Duolingo: one obvious next step, instant feedback and a reward at the end. The questions and what they save have not changed.
**Status:** active

## 2026-09-30 — Sign-in goes straight to the dashboard

**Decision:** After Google sign-in, or on opening /login while signed in, the server sends an established workspace straight to the dashboard and a new one to the brand brief, before anything renders. The "this workspace is already set up — open Brand settings or go to Ideas" chooser is gone; loading screens show skeletons shaped like the page instead of spinners or zeros.
**Why:** The onboarding form used to flash while a background check ran, and returning users were asked where to go when the answer is always the dashboard. The product's UX bar is a lesson app like Duolingo: one obvious next step, nothing flashing while it loads.
**Status:** active

## 2026-09-30 — Rotate the home thought on refresh

**Decision:** Daily Spark has no manual shuffle control. A page refresh selects a new thought, avoiding the previous one when browser session storage is available; the quote remains the focal point of the card.
**Why:** The extra button made a passive thought feel like another task. Refresh-based variety keeps the card calm while still feeling fresh.
**Status:** active

## 2026-09-30 — Lead with a useful thought, not a duplicate action

**Decision:** Mission Control gives an original posting thought strong visual hierarchy in place of the next-step card. It rotates daily and offers an optional Another control. Review status and actions remain in the header and review queue; plain-language progress labels and the simplified mobile header remain.
**Why:** The next-step card repeated actions already on the page, while the thought can reinforce steady, useful publishing as the page's focal moment without removing actual work.
**Status:** superseded by [Rotate the home thought on refresh](#2026-09-30--rotate-the-home-thought-on-refresh)

## 2026-09-30 — Make Mission Control action-first

**Decision:** The home page leads with the next useful action, uses plain-language progress labels, and omits the mobile header post quota, menu button, and blog shortcut. The quota and navigation remain available in the bottom-bar menu.
**Why:** Users should immediately see what needs attention without decoding internal automation terminology or losing scarce mobile header space.
**Status:** superseded by [Lead with a useful thought, not a duplicate action](#2026-09-30--lead-with-a-useful-thought-not-a-duplicate-action)

## 2026-09-30 — Save a rhythm before changing automatic drafting

**Decision:** Schedule setup asks for cadence and review first, shows whether the rhythm is a preview or saved, and requires those changes to be saved before the immediate automatic drafting switch can be changed. Optional content plan controls still save as they are changed.
**Why:** Users need to know which settings are active before they start or stop automatic drafting; an unsaved preview must not look like the current schedule.
**Status:** active

## 2026-09-29 — Show live blog broadcasts only for configured blogs

**Decision:** Mission Control shows the live blog broadcast section only when Blog publishing is enabled and the workspace has a company domain configured.
**Why:** links to a blog are misleading when the workspace has no active blog destination.
**Status:** active

## 2026-09-29 — Line icons are a cover illustration style, and icons need premium-size words

**Decision:** "Line icons" joins Shapes, Doodles and None as a cover
illustration a workspace (Brand page) or a single cover (Studio) can use. The
strategist names one icon per post from the same 97-icon set carousel pages
use; code checks the name and falls back to the post's words. On carousel
pages, an icon is kept only while the headline stays at least 85% of its size
without the icon and never below 84px (statements) or 76px (titles) at 1080
wide; otherwise the page is drawn without it.
**Why:** one visual family across a post's cover and its carousel, and an
icon must never cost the reader legibility. Premium means the words carry the
page; decoration yields.
**Status:** active

## 2026-09-29 — Carousel pages can carry a line icon, when the model thinks it helps

**Decision:** STAKES, POINT and STEP pages may show one faint line icon
under the words, from a fixed set of 97 work objects (Phosphor Icons "thin",
MIT). The model decides page by page whether an icon helps; a deck may have
icons on several pages, one, or none. No icon repeats in a deck, and when the
words don't fit beside the icon, the page is drawn without it.
**Why:** decks like Brain Station 23's use a small line drawing per page to
make each point easier to see at a glance. Code-drawn icons keep D19's "no AI
images" rule and cost nothing per carousel.
**Alternatives considered:** AI-drawn images per page (breaks D19, inconsistent
across pages); an icon on every page (reads as filler); commissioned custom
scenes (better, but a later step).
**Status:** active

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

## 2026-09-30 — Story sessions refill an author's experience

**Decision:** When fewer than 3 of an author's experience items are unused by
their recent ideas, the home page shows a "story bank low" card that opens a
lesson-app style session: 3 short questions, one at a time, aimed at the kinds
of experience the author has least of. Each answer becomes notes the author
confirms, saved as they go, and the session ends with one harvest. The card
shows only on weeks the weekly question is not open and the author has added
nothing yet, and the X hides it for a week, so it never nags. Reused items now take a different part of the story each time (the point,
the lesson, the myth, the cost, the reader's check).
**Why:** An author with 12 items and no weekly answers runs out in about four
harvests, after which ideas retell the same stories. The weekly question only
reaches people who open the app on the right week.
**Alternatives considered:** Emailing the weekly question (reverses D16; left
for a separate call).
**Status:** active
