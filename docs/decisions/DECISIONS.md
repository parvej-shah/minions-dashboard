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

## 2026-10-03 — Schedule setup starts from the saved rhythm

**Decision:** The Schedule page leads with automatic drafting status and the saved cadence, with schedule editing and slot-by-slot lane overrides revealed only when requested. For a new or changed schedule, users can save and turn on drafting in one explicit action; review-first remains the safe default unless the user changes it.
**Why:** Most people should not have to configure a cadence, publishing policy, and every upcoming slot just to start automatic drafting. Progressive disclosure keeps advanced controls available while the saved rhythm provides a useful default.
**Status:** active

## 2026-10-03 — Automatic drafting takes the oldest idea; no idea queue

**Decision:** The Ideas page has no user-managed drafting queue. When automatic drafting is on, Minions drafts the oldest eligible unused idea; users can still start a specific draft directly or set a draft time. Harvesting pauses once 10 unused, gate-passed ideas are available.
**Why:** Queue ordering added cognitive load without changing the regular drafting flow: automatic drafting can use the oldest available idea, and a bounded stock of 10 keeps the idea pool ready without accumulating excess.
**Status:** active

## 2026-10-03 — Ideas are shown oldest first with distinct draft states

**Decision:** The Ideas list defaults to oldest-first order. Ideas ready for drafting, drafts ready to open, active drafting and published ideas use distinct status labels and card colors; “Draft now” is the filled primary action and “Open draft” is neutral.
**Why:** The visible order should reinforce which idea automatic drafting will choose, and the cards should make the next action clear at a glance.
**Status:** active

## 2026-10-03 — A cover carries a short cover line when it says more than the headline

**Decision:** When a cover is drawn, a 3 to 6 word cover line is written from the finished LinkedIn post and set large in two lines. It replaces the headline only when Jev rates it as saying more plainly what the post is about than the headline does. Otherwise the headline stays, so no cover gets worse. The line may state no figure the post does not, and it is written once per draft. A new line is written only when an edit leaves the old one unsupported. A reviewer's own headline always wins. The strategist now writes its cover headline as 3 to 6 words too.
**Why:** The user rated the covers 7/10. The main gap was that a title-length headline (7 to 8 words) is too long for a thumbnail read in about a second, where click-through drops past six words. In a trial on 8 drafts, Jev rated the shorter line clearer for 4 of them. For the other 4 the short line lost the specifics, so they kept their headline.
**Alternatives considered:** Always using the short line (rejected: in the trial, squeezing to 3 to 5 words often dropped what made the line clear, for example "Onboarding should lead to output" against "Fourteen onboarding steps killed activation until we cut three").
**Status:** active

## 2026-10-03 — A cover makes one point at a glance and always matches its post

**Decision:** The cover's main line sets in at most three lines (the strategist writes 4 to 8 words, at most 55 characters), and the subtitle appears only under a short headline. The author's name and byline are larger so they read at phone feed size. Headline and Statement covers are the default and alternate. A Number or Quote cover is used only when Jev judges that the figure or line makes sense without the post and would make the reader stop more than the headline; it is no longer used just because it is its turn. A quote is taken from the LinkedIn post when the draft has one, since that is the text the cover is seen beside. When an edit leaves a cover behind (its quote was cut, it states a figure the post no longer has, or it shows an old title), the cover is redrawn when the draft is saved, approved or scheduled, keeping a reviewer's own headline when that is still true. Reviewers can still pick any layout.
**Why:** An outside review of live covers found headlines running to four to eight lines, Number and Quote covers that needed the post to make sense ("85 / AI-written posts versus 179 for the rest"), subtitles and bylines too small to read in the feed, and a cover that could go out quoting a line the post no longer had. Thumbnail guidance (YouTube and LinkedIn alike) is a few large words, one idea, read in about a second. The user asked for two to three lines at most.
**Alternatives considered:** Blocking approval until a reviewer redraws a stale cover (rejected: the user wants results, not another error to act on). Rejecting illustrations that don't fit the claim (left for later: it's mostly taste, and a rule would cause redraws for little gain).
**Status:** active

## 2026-10-03 — The cover headline is the post's title

**Decision:** The headline on the cover image and the carousel's first slide is now the post's title: it names what the post is about (the tool, product or change) and what happened or why, so someone scrolling past knows the subject at once. When the post is the author's own account it is titled as their story ("Why we replaced regex with Jev"). Abstract one-line maxims about the topic ("A regex counter cannot judge if writing sounds human") are no longer used, and category labels ("AI scheduling explained") stay ruled out.
**Why:** The user's test cover for the Jev post carried a general claim that didn't say what the post was about; a thumbnail is read in a second, and the title is what makes someone stop.
**Status:** active

## 2026-10-03 — An idea the author adds themselves is written as their own account

**Decision:** When the author adds their own idea with notes ("Add your own idea"), the draft treats those notes as the author's first-hand account: it may speak in the first person and use the figures and names the notes give, and it opens on the author's view rather than an imagined reader scene. Nothing beyond the notes may be claimed. The hook and the X post now get the same AI-pattern check and one rewrite as the body and the LinkedIn and Facebook posts.
**Why:** A test idea about our own switch to Jev, with real reach figures in its notes, came back as a story about an invented brokerage, with the figures and the tool's name gone: the notes were handled like a stranger's topic. The hook and X post, never checked, still carried the "it isn't X, it's Y" figure the rest of the draft had lost.
**Status:** active

## 2026-10-03 — Drafts are written as the author talking, and checked for AI patterns

**Decision:** Drafts speak as the author (first-person view, mixed sentence length) instead of a brand lecturing the reader, and avoid the figures that mark AI text ("it isn't X, it's Y", three-beat fragments, a closing maxim). Every finished draft is judged by Jev and code; one that still reads as template writing gets exactly one rewrite, kept only if it changes nothing but the wording and reads better. An idea with no author experience behind it is written as the author's take on the source, tied to their goal: never a neutral explainer, never invented experience. The strategist sees the last three weeks of arguments and must make a new point.
**Why:** On tenant zero's LinkedIn (Sep 2026) Minions posts drew a median 85 impressions against 179 for the profile's other posts; LinkedIn ranks on dwell time and expertise, and generic AI phrasing loses on both.
**Alternatives considered:** two or more rewrites (drift from the author's argument, 10-20 s more inside 02's two-minute call); prompt bans alone (the figures survived them); the author's own posts as the standard (AI-assisted too; Jev rates most of them as template).
**Status:** active

## 2026-10-03 — Brand settings lead with the author’s foundation

**Decision:** Brand opens on a plain-language overview, with audience and writing voice as the primary areas; idea sources and words to avoid sit under More settings, and visual cover styling is collapsed until needed.
**Why:** Most authors need to shape what they write and who it helps; feeds, blocklists and cover styling are supporting controls that should stay findable without competing for attention.
**Status:** superseded by [Brand settings are edited in one visible workspace](#2026-10-03--brand-settings-are-edited-in-one-visible-workspace)

## 2026-10-03 — Brand settings are edited in one visible workspace

**Decision:** Show brand basics, audience and experience, writing voice and proof, idea sources, and words to avoid as consecutive sections in one page, with jump links instead of hiding settings behind tabs or disclosures.
**Why:** Authors need to understand that these are editable inputs shaping future drafts; hidden destinations make the product’s core controls hard to discover.
**Status:** superseded by [Brand settings use focused, visible tabs](#2026-10-03--brand-settings-use-focused-visible-tabs)

## 2026-10-03 — Brand settings use focused, visible tabs

**Decision:** Brand settings show one editable area at a time in five visible tabs: Brand basics, Audience & experience, Writing voice, Idea sources, and Words to avoid. The overview's profile prompts open the relevant tab, and direct links retain their destination.
**Why:** The all-sections layout made the page long and hard to scan. Visible tabs keep every setting discoverable while giving each editing task a focused space.
**Status:** active

## 2026-10-02 — Phone review puts checks before publishing

**Decision:** On phones, Editorial Studio shows writing feedback and claim verification before publishing options. The fixed bar links to those options instead of publishing immediately; raw draft-check notes are not repeated in the claims card, and that card is omitted when there are no claims.
**Why:** Reviewers should encounter checks before the irreversible action, with one clear place to make the publishing decision.
**Status:** active

## 2026-10-01 — Editorial phone review keeps actions separate from context

**Decision:** The phone action bar shows only Save and Approve/Publish. Draft position, title, and claim counts stay in the review content and queue, not repeated beside the primary actions. Queue filters scroll horizontally on phones.
**Why:** The narrow action area should make the next decision obvious and keep both controls comfortable to tap without truncating context.
**Status:** superseded by [Phone review puts checks before publishing](#2026-10-02--phone-review-puts-checks-before-publishing)

## 2026-10-01 — The first post's cover is Statement with Shapes; Statement leads after it

**Decision:** The cover drawn for the first post (setup) is always the dark Statement layout with the Shapes illustration, never a number or quote cover. For every other draft, a verified figure still gets a Number cover and a strong line a Quote cover; otherwise Statement is now chosen before Headline. The rotation that avoids repeating the previous cover's layout stays. Reviewers can still change any cover in Editorial Studio. Always using Statement for every draft was rejected.
**Why:** Statement with Shapes is the boldest, cleanest first impression, and a figure or quote picked out of someone's very first post can feel random. Forcing one layout on every draft would make a LinkedIn feed look the same post after post, and Number and Quote covers stop the scroll better when the post really has a figure or a strong line.
**Status:** partly superseded by "A cover makes one point at a glance and always matches its post" (2026-10-03): Number and Quote covers now need Jev's judgement, not rotation; the first-post rule stands.

## 2026-10-01 — Setup ends by asking how covers sign off

**Decision:** Setup never asks for a business name up front. The name and photo on covers come from the user's Google account. The last question comes on the first-post screen, under the post: "How should your covers sign off?", with their name (editable) and an optional line under it (e.g. "Founder at Acme"). If they change it, the cover is redrawn with the same headline and illustration before Editorial Studio opens. That screen no longer has a Discard button; Review my post is its only action. Sending users to the Brand page for this was rejected.
**Why:** Asked last, after the post has shown what it's for, the question is easy to answer and the user sees its effect on the cover right away. For a personal LinkedIn post the author line should be the person, not a company, so the company belongs in the line under the name. The Brand page is a long form that would break the moment and pull them away from review. Discard on a celebration screen invited throwing away the first post before seeing it in review.
**Status:** active

## 2026-10-01 — Published library focuses on content, not production cost

**Decision:** The Published Posts summary shows live articles and available channel copy, without a Total Spend card.
**Why:** People come here to find and review published content; internal generation cost does not help them complete that task.
**Status:** active

## 2026-10-01 — The first post is reviewed in Editorial Studio, not posted from setup

**Decision:** The first-post screen shows the post as it will look on LinkedIn, now with its cover, and its one main action is Review my post, which opens it in Editorial Studio. The Post it button on that screen is removed; Discard stays (superseded: Discard was removed, see "Setup ends by asking how covers sign off"). The screen waits for the cover before revealing the post.
**Why:** Posting from setup skipped the cover, the carousel and the rest of the review, and a brand-new user's first public post should not go out from a celebration screen. Sending them to Editorial Studio shows everything Minions made and teaches the review step they will use from then on.
**Status:** active

## 2026-10-01 — Make the LinkedIn publishing format an explicit choice

**Decision:** When a carousel exists, reviewers choose Carousel or Cover image in a prominent control above the slides. The selected format is visible before they approve publishing.
**Why:** The prior checkbox beneath the slides hid a consequential publishing decision and made the alternate cover-image outcome easy to miss.
**Status:** active

## 2026-10-01 — Review a LinkedIn carousel before channel copy

**Decision:** When a LinkedIn carousel is available, Editorial Studio shows it before Channel preview. The channel section has one title and one subtitle, with a direct link to the cover style controls below.
**Why:** Reviewers should see the swipeable post first and immediately know where to edit its copy and cover.
**Status:** active

## 2026-10-01 — One authoritative channel preview in Editorial Studio

**Decision:** Editorial Studio uses one Channel preview as the authoritative representation of social copy, placed first in the review flow. The duplicate reader preview is removed; plain-language draft checks sit beside the publish decision, while each connected channel can be previewed, edited and saved in place.
**Why:** Two previews of the same post made users scroll through repeated content and left it unclear where edits belonged. One review surface creates a direct path from reading to editing to publishing.
**Status:** superseded by [Review a LinkedIn carousel before channel copy](#2026-10-01--review-a-linkedin-carousel-before-channel-copy)

## 2026-10-01 — Editorial Studio is a guided review flow

**Decision:** Editorial Studio leads from a plain-language draft queue into one selected post and one dominant Approve & publish action. Technical version and audience-lane badges, duplicated navigation, duplicated save controls, and operator terminology are removed from the main decision path; editing, scheduling, claims and destructive actions remain available as supporting controls.
**Why:** Reviewing a post should feel like completing one focused lesson: know which draft you are reviewing, understand what to check, and see the next action immediately without decoding system metadata or choosing between repeated controls.
**Status:** active

## 2026-10-01 — Setup ends with the user's first post

**Decision:** Setup asks three questions: what you want to be known for, who reads you, and one thing from your work (a lesson, an opinion or what you're building). That answer is saved as an experience item, and the first post is drafted from it by the normal pipeline, with its claims check, while a lesson-style screen shows progress. The post is then shown as it will look on LinkedIn, with a plain-language list of what to check and three choices: Post it (scheduled into the next posting slot), Edit (in Editorial Studio) or Discard (the Post it choice is superseded by [The first post is reviewed in Editorial Studio](#2026-10-01--the-first-post-is-reviewed-in-editorial-studio-not-posted-from-setup)). LinkedIn is connected at that point, not during setup. Experience level, voice, company and publishing mode start from defaults (Practitioner, "Direct & practical", none, review first) and are changed later in Brand and Schedule. Editorial Studio shows the same LinkedIn reader view and plain-language checks at the top of every draft.
**Why:** Six screens of decisions came before any value, and new users could leave before their workspace existed. Seeing a real post in their own words is what hooks them, and it teaches that their experience is what makes a post strong. Rejected: a faster in-app draft at the end of setup, because it would skip the claims check and the cover; the real draft takes about a minute.
**Status:** active

## 2026-10-01 — Ideas leads with what gets written next

**Decision:** The Ideas page leads with Up next: users choose an idea, place the strongest one first, and Minions drafts that first idea automatically. The full idea library remains a secondary view; Calendar is removed from this page, while scheduling remains available from idea details. Cards hide system metadata, manual ideas no longer require legacy topic classification, and Draft Now moves into idea details.
**Why:** Users should make one understandable decision without learning pipeline statuses, harvested pools, claim mechanics, or competing queue-versus-draft paths.
**Status:** superseded by [Automatic drafting takes the oldest idea; no idea queue](#2026-10-03--automatic-drafting-takes-the-oldest-idea-no-idea-queue)

## 2026-09-30 — The brand brief is a lesson, one question per screen

**Decision:** The setup wizard asks one question per screen: what you want to be known for, who it's for, how deep your experience is, where you work (skippable), and your voice. The flow ends on a "your brief is ready" screen where you choose review-first or auto-publish. Every answer can be one tap on an example, and each screen has a single CONTINUE button that confirms a good answer.
**Why:** The old three-step form put up to eight fields on one screen, which read as paperwork. The UX bar is a lesson app like Duolingo: one obvious next step, instant feedback and a reward at the end. The questions and what they save have not changed.
**Status:** superseded by [Setup ends with the user's first post](#2026-10-01--setup-ends-with-the-users-first-post)

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
