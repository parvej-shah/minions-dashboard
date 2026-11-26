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
## 2026-11-21 — Dictation inserts at cursor with top-right sticky mic and Alt+D shortcut

**Decision:** Free speech dictation across the app (and specifically the post edit box) now inserts or replaces text at the active text cursor (`selectionStart`/`selectionEnd`) instead of appending to the end of the post. In multiline editors, the microphone sits top-right (never bottom-right) and smoothly clamps to the viewport top when scrolling, remaining accessible without scrolling and without occluding text. Focused fields can toggle dictation instantly with `Alt + D` (or `Option + D`).
**Why:** Appending spoken text to the end of a multi-paragraph draft forced users to scroll to the bottom, cut the text, and paste it where they wanted it. Pinned bottom-right mics forced scrolling to find the button and occluded final lines of text. Caret insertion, top-right sticky placement, and keyboard toggling match universal editor mental models and eliminate editing friction.
**Alternatives considered:** Mic following the moving cursor across lines (evaluated via /intent and rejected: occluded words, created moving targets violating Fitts's law, collided with text selections).
**Status:** active

## 2026-11-21 — Enforce channel connection before posting or scheduling (Option B)

**Decision:** If a user has not connected the distribution channel that a post is written for (e.g. LinkedIn), the primary post button in Editorial Studio and Today no longer shows "Post now" or "Post on [date]" nor permits publishing. Instead, it displays "Connect LinkedIn to post" (or respective channel) and opens the channel connection sheet modal directly. Once connected, returning to the draft unlocks normal posting and scheduling.
**Why:** Previously, clicking "Post now" without a connected channel marked the post as PUBLISHED and triggered publishing, which skipped or failed on social platforms while falsely claiming "Published live to LinkedIn". Forcing channel connection prevents phantom publishes, restores trust, and makes channel setup clear before any post is approved.
**Alternatives considered:** Option A (leaving button as "Post now" and intercepting on click; rejected in favor of Option B's upfront transparency), allowing posts to publish only to the blog silently (rejected: Minions Post Studio is hired primarily for LinkedIn authority, not a standalone ghost blog).
**Status:** active

## 2026-11-14 — Remove status and metadata eyebrow row from Today spotlight card

**Decision:** The metadata row (`● Ready for your OK · [Format] · [Channels] · Draft X of Y`) at the top of the Today spotlight card is removed. The card opens directly and boldly with the post headline, followed by the hook excerpt quote, the primary schedule CTA (`Approve for [Slot]`) + Studio edit link, the angle switcher row, and the hero cover artwork on the right.
**Why:** The status line added unnecessary visual noise above the article headline. The post's readiness is already made obvious by the large "Approve for [Slot]" button, the format and styling are directly evident from the hero poster artwork, and the draft count is already contextualized in the angle switcher ("Browse all N in Posts"). Removing the metadata row gives the headline maximum punch and restores executive calm to the Today view.
**Alternatives considered:** Moving the metadata row to a tooltip (rejected: extraneous interaction), styling as subtle chips (rejected: any row above the headline competes with the editorial lead).
**Status:** active

## 2026-11-14 — Dynamic Failed tab in Posts filter bar

**Decision:** The "Failed" tab in the Posts filter bar is hidden by default when there are zero failed posts (`failedCount === 0`), and dynamically appears (with its failed count badge) only when failed posts actually exist (`failedCount > 0`). If a user visits or stays on `?show=failed` when all failed posts are resolved or none exist, the view smoothly falls back to the default tab (`Needs you` or `All`).
**Why:** A persistent empty "Failed" tab introduces unnecessary visual clutter and prompts user anxiety about post delivery errors when everything is healthy. Showing the tab only when errors actually occur preserves a clean 4-tab filter bar (`All`, `Needs you`, `Scheduled`, `Posted`) for everyday triage while ensuring immediate prominence when attention is required.
**Alternatives considered:** Keeping the "Failed" tab always visible with a zero count badge (rejected: clutters the Segmented control when there are no issues), showing an alert banner on all tabs instead of a tab (rejected: the dedicated tab organizes failed posts with 1-tap retry without pushing down the triage grid).
**Status:** active

## 2026-11-14 — Impeccable Today spotlight card: clutter elimination & hero poster balance

**Decision:** The Today spotlight card is distilled into a calm, magazine-grade layout: the cover poster width is expanded from narrow 220px to a generous 320px–340px hero artwork that honors its 4:5 portrait aspect ratio. Clutter and competing actions are removed: the noisy uppercase eyebrow, redundant thesis paragraph, static button pill, and loud angle bubble toolbar are replaced by a unified status line (`Ready for your OK · [Format] · [Channels] · Draft X of Y`), a single prominent `Approve for [Slot]` button, a quiet `Edit in Studio ↗` affordance, and a minimal inline angle switcher.
**Why:** Busy founders and brokers hire Minions for finished outcomes, not triage homework. Packing 10+ badges, secondary buttons, duplicate headings, and squeezed thumbnails turned the Today decision into visual noise. Giving the poster generous presence and stripping micro-actions down to one clear decision restores executive calm and focus.
**Alternatives considered:** Keeping angle bubble chips (rejected: loud and distracting), shrinking card padding (rejected: whitespace is essential to the Apple-grade aesthetic).
**Status:** active

## 2026-11-14 — Today post cards precision & direct edit-mode clickable surface

**Decision:** The post card on the Today tab is an interactive, clickable surface that navigates directly to edit mode (`/editorial?id=...`), with a clear hover affordance indicating "Click card to edit ↗". Inner buttons (such as 1-tap Approve, Angle Switcher chips, and schedule controls) stop propagation to preserve inline actions. The card displays executive precision metadata tailored for our ICP: target destination channels (LinkedIn, Instagram, Facebook), visual format label (Carousel slide count vs Cover poster), strategic topic/pillar tag, core thesis argument, and 1-tap angle switching.
**Why:** Busy B2B service founders, agency executives, and brokers need to evaluate today's post in seconds. Previously, the card lacked channel clarity, format indicators, and thesis context, and forced users to hunt for small edit links. Making the entire card a tactile entrance to Studio with immediate angle comparisons and channel transparency aligns directly with executive decision-making.
**Alternatives considered:** Opening a modal for quick edits (rejected: Editorial Studio is the dedicated place for draft edits and review), making only the headline a link (rejected: founders expect the entire card surface to be clickable on modern web dashboards).
**Status:** active

## 2026-11-14 — Quick draft top picks integration & dedicated Failed posts tab

**Decision:** Quick drafts triggered via the "+ Quick draft" drawer now surface immediately in the "Top three picks for you" triage shelf as `#1 Up next · Generating draft…` alongside live progress and completion banners; posts with channel publish failures are moved into a dedicated "Failed" tab (`/posts?show=failed`) featuring 1-tap direct retry rather than hiding inside the "Posted" tab.
**Why:** Users previously lacked visual feedback while Minions synthesized drafts in the background, making drafting feel detached from their primary review queue. When scheduled posts failed to publish to LinkedIn or Instagram, burying them in the "Posted" tab with ambiguous coral subtext caused confusion and prevented easy remediation. Surfacing failed posts in their own tab with 1-tap retry gives users immediate control.
**Alternatives considered:** Modals during draft generation (rejected: blocks navigation for ~1 min), keeping failed posts inside Posted with a filter dropdown (rejected: failed posts require urgent action and shouldn't masquerade as published).
**Status:** active

## 2026-11-12 — Autonomous outcome architecture: 3-tab navigation & 5-draft buffer

**Decision:** The Ideas page is removed from primary navigation, leaving three calm destinations: Today, Posts, and Brand; `/ideas` redirects to `/posts?show=needs`. Automatic drafting runs on schedule up to a maximum buffer of 5 unreviewed drafts (`PENDING_REVIEW`), pausing until the user reviews or posts. Spontaneous thoughts or links can be drafted immediately via a single-input "+ Quick draft" drawer available on Today and Posts.
**Why:** Busy founders and brokers hire Minions for finished outcomes, not triage homework. An ideas backlog creates subtle guilt and feels like an unread email inbox. Minions acts as an autonomous ghostwriting agency that drafts posts ahead of schedule, respecting executive cognitive load.
**Alternatives considered:** Keeping Ideas as an active tab (rejected: forces users into unnecessary idea gardening), unlimited automatic drafts (rejected: creates overwhelming post backlogs if a user steps away).
**Status:** active

## 2026-11-12 — Streamline Editorial Studio review for busy professionals

**Decision:** The yellow compliance check warning ("X facts aren't checked yet") is removed from the primary decision sidebar; the Details accordion defaults to collapsed; ambiguous "Edit text" in the sidebar is removed in favor of localized card edits; internal AI self-justifications ("Why this wording") and subjective grammar lecturing are removed; and thick side-tab borders are replaced with refined subtle borders.
**Why:** The core ICP consists of busy founders and executives who review content in 15- to 30-second fragments. Treating them like students grading AI homework or presenting 42 competing buttons causes cognitive fatigue, decision paralysis, and review backlogs. The review page must deliver an effortless, confident outcome.
**Alternatives considered:** Keeping the claims warning only when facts are flagged (rejected: still creates hesitation and anxiety on drafted posts), placing a global edit modal in the sidebar (rejected: localized card edits provide clearer mental models).
**Status:** active

## 2026-11-12 — Rename Studio card to 'Carousel'

**Decision:** The card in Editorial Studio is titled "Carousel" (formerly "LinkedIn carousel"), and explanatory copy describes it neutrally as a swipeable series of slides rather than a LinkedIn-only PDF.
**Why:** The carousel asset now serves both LinkedIn and Instagram (via multi-page JPEG saving and unified post format selection). Retaining the "LinkedIn" prefix gave users a false mental model that the asset was only for LinkedIn. Titling it "Carousel" also creates symmetric visual hierarchy with the "Cover" card directly preceding it.
**Alternatives considered:** "Multi-slide post" (clunky; industry standard term is carousel across both platforms), "LinkedIn & Instagram carousel" (redundant and cluttered).
**Status:** active

## 2026-11-12 — Unified carousel format decision across LinkedIn & Instagram

**Decision:** The format decision between carousel and single poster is unified into a single "Post format" segmented control on the Carousel card. Choosing carousel sets both LinkedIn and Instagram to carousel format (with Instagram providing the swipeable page gallery and "Save all N pages" button for manual posting); choosing single poster sets both to the cover image. The duplicate "Post on Instagram" format selector on the Instagram tab is removed, and the "Edit post" button is restored on the LinkedIn tab.
**Why:** Reviewers were forced to make the same formatting decision twice in two separate places (once on the Carousel card and once inside the Instagram tab). Unifying this eliminates decision fatigue and cognitive dissonance, while preserving the user's manual posting choice. Restoring the Edit post button ensures LinkedIn post captions can always be refined naturally before posting.
**Alternatives considered:** Keeping two independent selectors (led to redundant clicks and format mismatches between platforms).
**Status:** active

## 2026-11-10 — Brand opens on four basics; the rest is Advanced

**Decision:** The Brand page shows only what a post can't be written without: what you do, who you write for, what you post about, and what you've done. Writing voice, reader details, all experience, facts and what sets you apart, words to avoid, idea sources and cover look sit in one closed "Advanced" list, each its own page. The profile score and its three nudges are gone; one quiet line appears only while a basic is missing.
**Why:** These four are what the engine depends on (positioning, the ICP line, topics, and experience the authority gate requires); everything else has a working default and only makes posts sound more like the author. A busy founder happy with the basics never has to read the rest (user, 2026-11-10). Same data and engine; tasks/30.md maps each setting to where the engine reads it.
**Alternatives considered:** Five equal tabs (the old page: every setting looked required); a completeness score (nagged about optional extras).
**Status:** active

## 2026-11-10 — Setup examples follow the user's own answers

**Decision:** The grey example in "Who should your posts reach?" is written from what the user wants to be known for, and the story box's example from both answers (a dentist-tax adviser sees "Dentists who own their practice"). Placeholder only: no tap-to-use chips, never saved or sent to the writer. If the model is slow or down, the fixed example stays.
**Why:** A generic example ("Brokerage owners…") makes a dentist do the translation; their own field shows what a good answer looks like (user, 2026-11-10).
**Alternatives considered:** Tap-to-use suggestion chips (more on screen, against minimalism; and a tapped example is no longer their words).
**Status:** active

## 2026-11-10 — The welcome page speaks to the ICP; setup is four calm steps

**Decision:** The sign-in page is the landing: a line drawing, "You're good at what you do. LinkedIn just doesn't know it yet.", one line ("One post a week from your real work. Nothing goes out until you say yes."), one "Continue with Google" and "Free for 14 days." Nothing else. Setup is four steps (profile, reading, check it, one story), one question per screen. The story-kind selector is gone: a picked item keeps its kind, typed text counts as a lesson.
**Why:** The ICP is B2B service founders who should post and don't. The headline names that feeling, and minimalism is the core value on every screen (user, 2026-11-10). Mascot bubbles, praise banners, meters and kind pickers added choices without adding outcomes.
**Alternatives considered:** A Clio-style page with sign-in links, footer and trust lines (trimmed at the user's request: "does our landing page is minimal??").
**Status:** active

## 2026-11-09 — Approving a post puts it in the next free posting time

**Decision:** On the review screen the main button for a waiting post reads "Post on <day time>" and schedules it into the next posting time no other post holds. Posting right away, another time, marking it posted by hand and deleting are quieter options under it.
**Why:** The owner's decision is "yes, this one"; the schedule they already set says when. One click, and the button says exactly when it goes out.
**Alternatives considered:** "Approve & publish" now as the main button (posts at odd hours, ignores the schedule); asking for a time every approval (one more decision per post).
**Status:** active

## 2026-11-09 — Calm, light redesign: four places, one decision per screen

**Decision:** The dashboard is rebuilt light (Apple-style neutrals, one blue action colour) with a top menu of four places: Today (home), Ideas, Posts, Brand. Billing, team, channels, schedule and the blog link move under the avatar. Today opens on the one thing to do (posts waiting for your OK, or "all caught up"); Posts is one image grid filtered Needs you / Scheduled / Posted; the review screen shows the post first with one primary button that says when it goes out. Confetti, streaks and 3D buttons go.
**Why:** Busy owners found the dark, dense Studio heavy and were afraid to act. Research (apple.com, Pinterest UI boards, 2026-11-09) pointed to white space, one action per view, and image-first lists. Today is not a repeat of other pages: it is the next decision.
**Alternatives considered:** Restyling the dark theme (still dense); keeping Studio as home (the review queue and its tools overwhelm first).
**Status:** active

## 2026-11-09 — Unpublish from LinkedIn in the Studio

**Decision:** A published post that Minions sent to LinkedIn shows "Unpublish from LinkedIn". After a confirm, Minions deletes the post on LinkedIn, takes it off the blog, and returns the draft to the review queue with its content kept. A post copied to LinkedIn by hand, or one that also went to Facebook, still can't be unpublished from Minions. Supersedes 2026-10-24.
**Why:** The user wants posts pulled back from the Studio. Minions can delete LinkedIn posts it created with the workspace's own connection, so the 2026-10-24 reason no longer holds.
**Status:** active

## 2026-11-09 — A workspace markets Minions Ghostwriter itself

**Decision:** The parvejshalabib007s-workspace now markets Minions Ghostwriter (this product) to founders and consultants who run small B2B service businesses and should post on LinkedIn but don't. Its posts come from our own build story and data (the decisions in this log), lead with the outcome, and never claim customers or results we don't have. The user posts them by hand. Tenant zero stays the voice AI brand.
**Why:** We want to start marketing the product now, and our own build-in-public data is the most credible material we have.
**Status:** active

## 2026-11-09 — Outcome-first posts name no products or assistants

**Decision:** Posts for outcome buyers don't name products, named assistants, tools or vendors (e.g. "via Zip"). They say what the thing does for the reader ("a text goes back within five seconds"). The company's own name is still allowed. The bsse1610 workspace's brand rules and stories were rewritten to drop the crew names (Rex, Zip, Pip, Gia, Otto).
**Why:** A business owner has never heard of "Zip"; an unexplained name reads as jargon and pulls attention from the result.
**Status:** active

## 2026-11-09 — Posts lead with the outcome for business-owner buyers

**Decision:** Every ICP now says what the reader buys: the outcome (the default) or how it works. For outcome buyers, posts and covers lead with what changes in the reader's business (customers, time, money, risk). The technology gets at most one plain sentence per point, in the reader's words, as the reason it works. A workspace that sells to technical buyers switches to "How it works" on the Brand page and keeps the technical depth.
**Why:** Most workspaces sell services to business owners, who care about the result, not the technology. Drafts were leading with the mechanism (e.g. "Latency over 1.8 seconds kills calls").
**Alternatives considered:** Outcome-first for everyone with no switch: rejected, because technical-buyer workspaces need the depth.
**Status:** active

## 2026-11-09 — No AI-generated cover images

**Decision:** Covers are only drawn in code from the brand's layouts. The AI image option (Qwen Image through n8n 04_hero_image) is removed, not just switched off.
**Why:** No workspace used it (nothing asked for it since covers moved to code), every cover is code-drawn for free in about a second, and its free image quota is gone.
**Alternatives considered:** keep it dormant behind `cover_mode: AI_IMAGE` (rejected: dead code, a public image-download route and a paid model to keep alive).
**Status:** active

## 2026-11-09 — Reviewers can choose the carousel design

**Decision:** On the carousel card a reviewer may pick one of the seven designs before the slides are written (the default is "Let the writer choose"), and switch a finished carousel to another design at any time. A switch redraws the same words with no AI call; if the words don't fit the new design it is refused with the reason and the carousel stays as it was. "Make again" keeps the current design.
**Why:** the user wanted control over the look without paying for, or waiting on, a rewrite.
**Status:** active

---
## 2026-11-09 — Seven carousel designs, plus Grid and Punch pages

**Decision:** The carousel writer now picks from seven page designs: Editorial, Bold and Minimal, plus Poster (alternating dark and light, a ribbon across the pages), Swiss (a fine column grid, italic key word, dark close), Aurora (dark, colour glows, glass panel) and Bento (raised cards on a grey page). It chooses one per post by tone. It may also use a Grid page (3 to 6 icon tiles) and a Punch page (3 or 4 short lines, then checks).
**Why:** the user wanted carousels that feel modern and premium and less alike from post to post. They reviewed sample decks in every new design and approved all of them for production.
**Alternatives considered:** shipping only one or two of the new designs; letting the reviewer pick the design by hand (possible later, in the Studio).
**Status:** active

---
## 2026-11-09 — Covers use Bricolage Grotesque and Plus Jakarta Sans

**Decision:** Every cover and carousel page now sets headlines, quotes and big numbers in Bricolage Grotesque (ExtraBold) and the label, subtitle, list text and author line in Plus Jakarta Sans, for every workspace. This replaces Newsreader and Inter. Both are free for commercial use (SIL Open Font License). The quote mark is drawn as a shape, and the quote text is upright because Bricolage has no italic.
**Why:** the serif and neutral sans looked like most other LinkedIn graphics and didn't stand out in a feed. A heavy, characterful sans stays readable at phone-thumbnail size. Compared against Fraunces, DM Serif Display and Instrument Serif on the same posters; the thin serif vanished at thumbnail size.
**Alternatives considered:** DM Serif Display with Manrope (the safe serif upgrade); Fraunces with Manrope (warm, but needed spacing work).
**Status:** active. Supersedes the Newsreader and Inter part of the fixed type system decided 2026-09-24 in [authority-flywheel-plan.md](../product/authority-flywheel-plan.md) (phase 5). The "one shared type system for every tenant" part is superseded on 2026-11-19 by "Each workspace picks its cover font": Bricolage stays the default.

---
## 2026-11-09 — Eight modern banner types join the cover types

**Decision:** Covers get eight more types, next to the existing eight. Each adds one hand-made touch to the brand's type: Torn (a torn paper strip reveals the subtitle), Selected (the key word in a design tool's selection box with the author's cursor), Sticker, Notebook, Notes (a phone notes card), Post card (the headline as the author's post, with no like or view counts), Circled (the key word circled by hand) and Cut-out (the author's cut-out photo in front of one giant word). On these types the emphasised word is set in a real italic (Instrument Serif Italic). They join the automatic rotation with Statement and Headline, and a structured type (List, Grid, Punch, Number, Quote, Photo) is now followed by one of these headline types, so the feed alternates. Cut-out counts as a face poster, like Photo: at most one face poster in four covers. Torn needs a subtitle. Cut-out needs a cut-out photo (a PNG with a transparent background) uploaded on the Brand page.
**Why:** The user reviewed samples of every design on real headlines and wanted them in production for a more premium, modern feel (2026-11-09).
**Alternatives considered:** Keeping the banners as samples until the carousel redesign (rejected: the banners were ready and the carousel needs more work). The torn-paper idea is a general paper motif from the Pinterest research, not a copy of one designer's edge, which stays rejected (see the entry below).
**Status:** active. Changes the rotation in "Five poster types, each with its own background" below: headline types now alternate with structured types.


## 2026-11-09 — Five poster types, each with its own background

**Decision:** Covers and carousel pages come in five poster types, and each type always has its own background: a two-tone hook on a soft gradient, a problem with a numbered list on a grain grid, an icon grid on folded paper, short punch lines with a checklist on a colour block, and a photo-led poster (the author's photo, large) on a dark glow. Every background is drawn only from the workspace's brand colours, and every poster uses the one shared type system (see the fonts entry above). The cut-paper waves background is kept as a spare. Reviewers can't change a type's background, but they can switch any cover to another type the post supports and edit its text (headline, list points, tile labels, punch lines), held to the same checks as generated text. All posters share the author line; carousel pages also carry a slide number.
**How a cover's type is chosen:** the post decides which types fit (a list of 3-4 points, 3-6 parallel things, short punch lines, the author's own story, or a figure or quote Jev judged strong). Among those, the type this workspace used least recently wins, and the last cover's type is never repeated. The photo poster needs an opaque headshot and the author's own story, and appears at most once in four covers. The first post gets the photo poster when there is a usable headshot, otherwise Statement (updates 2026-10-01). Copy that can't fit falls to the next type, ending at Headline.
**Why:** Every post had the same frame, so a feed of covers looked identical. The user wanted the variety to stand out but stay in the brand's colours. Prototypes in our own renderer showed all six backgrounds work for any palette with no tuning per tenant.
**Alternatives considered:** Letting a reviewer pick any background for any type (rejected for now: fixed pairs keep every type distinct and are simpler to check for contrast and fit). Copying a reference design's torn-paper edge (rejected: it's that designer's signature).
**Status:** active. Supersedes the "all four share one frame" rule decided 2026-09-24 in [authority-flywheel-plan.md](../product/authority-flywheel-plan.md) (phase 5); the fixed type system from that decision stands.


## 2026-10-24 — Brand's "What you do" is about the writer, not the reader

**Decision:** Setup saves the brief's positioning (what the writer does) as the brand positioning. If there is none, it saves what they want to be known for, and the audience only as a last resort. Brand shows it as "What you do". When an older workspace's positioning only repeats the audience, Brand asks the writer to say what they do instead of showing the audience twice.
**Why:** Setup stored the audience description as the positioning, so Brand showed the same reader sentence under both Positioning and Audience. Covers and the draft check also read that field as facts about the writer.
**Status:** active

## 2026-10-24 — Published LinkedIn posts can't be "unpublished" from Minions

**Decision:** A published post that went only to LinkedIn no longer offers Unpublish. Only a post on the workspace's blog can be taken down from the Studio ("Take down from blog"), and that dialog says the LinkedIn post stays up. Removing a post from Minions says the same. A published post's panel shows "View on LinkedIn" and drops the pre-publish checks.
**Why:** Minions can't take a LinkedIn post down. Unpublish only marked it offline in Minions while it stayed live on LinkedIn, so the button promised something that didn't happen.
**Status:** superseded by 2026-11-09 (Unpublish from LinkedIn in the Studio)

## 2026-10-23 — Drop Mission Control; Editorial Studio is home

**Decision:** The Mission Control page and its sidebar, bottom-bar and app-shortcut entries are gone. `/` now opens Editorial Studio. The weekly question moves to the top of the Studio, and the Daily Spark quote is dropped.
**Why:** Every part of the page repeated another one (the review queue, the counts, the shortcut buttons, and a blog list most workspaces never see). That put an extra step between users and the Studio, where the work happens. A home page can come back once it shows something no other page does, such as reach over time.
**Alternatives considered:** Renaming it "Home" and slimming it down. That still leaves a page with no job of its own.
**Status:** superseded by [Calm, light redesign](#2026-11-09--calm-light-redesign-four-places-one-decision-per-screen)

## 2026-10-23 — Users can erase their own account from the account modal

**Decision:** The account modal (avatar → Sign out) has a quiet "Erase my account" link. Erasing asks for the word "erase" typed out, then deletes the workspace and everything in it if it's theirs alone; a workspace shared with teammates or with a pending invite stays, and only their login goes. It's refused while a paid plan is still billing (cancel in Billing first), and staff accounts can't erase themselves here.
**Why:** People should be able to leave without emailing us, and test sign-ups needed a hand-run database script to reset.
**Alternatives considered:** A soft delete with a grace period (more to build and explain; can come later if people erase by mistake).
**Status:** active

## 2026-10-23 — LinkedIn is connected from Editorial Studio; Channels is hidden

**Decision:** The Channels tab is hidden from the sidebar for now. LinkedIn, the channel posts go to, opens as a modal from a "LinkedIn" button beside "Schedule" in Editorial Studio, and LinkedIn's sign-in returns there. /fleet still works by URL for the blog, Facebook and X settings.
**Why:** Connecting LinkedIn belongs next to the drafts it publishes; a separate Channels page was one more place to find for a single channel most users need.
**Status:** active

## 2026-10-23 — Unchecked claims warn at the publish button but don't block it

**Decision:** In Editorial Studio the Claims Gate sits above "Ready to publish?", and while any claim is still flagged a gold warning sits right above Approve & publish, telling the author to mark it Verified or edit the post. Publishing stays allowed.
**Why:** The gate sat below the publish buttons, so authors published without seeing flagged claims. Moving it up and warning at the button makes it hard to miss without stopping someone who already removed or checked the claim.
**Alternatives considered:** disabling Publish and Schedule until every flagged claim is confirmed (rejected by the product owner for now: a claim edited out of the post stays flagged, so it would force a meaningless click); a confirm step on publish (more friction than a visible warning).
**Status:** active

## 2026-10-12 — Brand setup is read from LinkedIn and the website, not typed

**Decision:** Onboarding opens with "drop your LinkedIn PDF (or résumé) and your website". Minions reads them, and the user watches their brand assemble live: positioning, audience, experience items and voice appear as each one is extracted. One review screen follows, where they remove or edit anything and tick which website claims are true; nothing is saved before "Looks right". The first post then starts from an experience item they pick. Typing the three setup questions stays as a small fallback link. Existing users get the same import as "Refresh from LinkedIn/website" on the Brand page, which only adds new items and never overwrites their edits.
**Why:** Users objected to the Brand page as old-style forms that took hours to fill in. Reading what they have already written removes the typing while keeping D3's short onboarding.
**Rules kept:** proof found on a website is never saved as verified without the user ticking it; experience items come only from facts in the PDF or site (roles, things built, stated results), never invented stories or lessons; completeness stays honest, not "100% done".
**Alternatives considered:** saving everything as it streams (rejected: unreviewed AI output would reach drafts); import as an optional shortcut beside the questions (rejected: the questions are the friction).
**Status:** active

## 2026-10-07 — Idea harvesting stops at 15 unused ideas of any grade

**Decision:** Minions stops finding new ideas for a workspace once 15 unused ideas are waiting, counting below-bar and never-checked ideas as well as passing ones. Rejected, drafted and claimed ideas don't count.
**Why:** Only passing ideas used to count, so workspaces whose ideas mostly scored below the bar kept harvesting every night and piled up 30 or more unused ideas. Below-bar ideas are still drafted when nothing stronger is ready, so they are real stock.
**Alternatives considered:** keeping the limit of 10 passing ideas, which never fills in a workspace whose harvests mostly score below the bar.
**Status:** superseded by 2026-10-28 — At most 10 unused ideas; ask for pasted posts when there's no own material

## 2026-10-03 — A published draft can go to LinkedIn again in the other format

**Decision:** After a draft goes out on LinkedIn with its cover, the reviewer can post its carousel as a second LinkedIn post, and after a carousel post, its cover. The second post is a new draft: LinkedIn only, new text that does not open like the first post, same review and scheduling as any draft, one per published draft, and it does not count toward the monthly draft limit. The first post is never changed.
**Why:** LinkedIn cannot swap the media on a live post, and republishing duplicated the whole post. A reworded second post a few days later reaches people the first missed without reading as a repost.
**Status:** active

## 2026-10-03 — Put core work destinations first in navigation

**Decision:** Place Schedule immediately after Editorial Studio, Brand & Directives before Published Posts, and Published Posts before Channels and Billing.
**Why:** Navigation order should prioritize the destinations users need for their regular work.
**Status:** active

## 2026-10-03 — Remove repeated Mission Control pipeline cards

**Decision:** Remove the Ideas, Drafting, Review and Published mini-card strip below the summary cards.
**Why:** It repeats the same counts and adds visual clutter.
**Status:** superseded by [Drop Mission Control; Editorial Studio is home](#2026-10-23--drop-mission-control-editorial-studio-is-home)

## 2026-10-03 — Hide Content Performance from navigation

**Decision:** Remove Content Performance from the dashboard navigation.
**Why:** The user asked to hide the tab.
**Status:** active

## 2026-10-03 — LinkedIn posts end with 2 to 3 specific hashtags

**Decision:** Every LinkedIn post ends with a line of 2 to 3 hashtags naming its specific topic, industry or audience (like #VoiceAI, #RealEstateTech), never generic tags like #AI or #Leadership. More than 3 fails the variant check; fewer than 2 is flagged for review, not blocked. Facebook and X stay at none unless the brand names one.
**Why:** The owner asked for them. Once drafts were rewritten to sound like the author (same day), the writer started dropping the optional "max 2" hashtags entirely.
**Status:** active

## 2026-10-03 — Jev decides what kind of claim each sentence is

**Decision:** The draft check takes each claim's type (opinion, customer result, statistic, fact, market or product claim) from Jev; the editor model's label is used only when Jev is unavailable. Opinions skip the check, customer results need an experience item or approved proof, the rest need a source.
**Why:** On 166 stored claims labelled by hand, the editor model called 28 checkable claims opinions, so they passed unchecked; Jev did that 6 times, at about 0.3s per draft. Jev sends more opinions to review instead (25 vs 10), the safe direction.
**Alternatives considered:** Keeping the stricter of the two labels: no customer result missed, but it keeps the editor's habit of calling generic figures customer results, which wrongly blocked 15 claims against Jev's 2. Jev's one miss in the sample was labelled a statistic, so it still went to review.
**Status:** active

## 2026-10-03 — Schedule setup starts from the saved rhythm

**Decision:** The Schedule page leads with automatic drafting status and the saved cadence, with schedule editing and slot-by-slot lane overrides revealed only when requested. For a new or changed schedule, users can save and turn on drafting in one explicit action; review-first remains the safe default unless the user changes it.
**Why:** Most people should not have to configure a cadence, publishing policy, and every upcoming slot just to start automatic drafting. Progressive disclosure keeps advanced controls available while the saved rhythm provides a useful default.
**Status:** active

## 2026-10-03 — Automatic drafting takes the oldest idea; no idea queue

**Decision:** The Ideas page has no user-managed drafting queue. When automatic drafting is on, Minions drafts the oldest eligible unused idea; users can still start a specific draft directly or set a draft time. Harvesting pauses once 10 unused, gate-passed ideas are available.
**Why:** Queue ordering added cognitive load without changing the regular drafting flow: automatic drafting can use the oldest available idea, and a bounded stock of 10 keeps the idea pool ready without accumulating excess.
**Status:** active; the harvest limit is superseded by 2026-10-07 — Idea harvesting stops at 15 unused ideas of any grade

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

*Partly superseded 2026-11-09: the first post now gets the photo poster when there is a usable headshot, and types rotate by what the post holds.*

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
**Status:** superseded by [Drop Mission Control; Editorial Studio is home](#2026-10-23--drop-mission-control-editorial-studio-is-home)

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
**Status:** superseded by [Drop Mission Control; Editorial Studio is home](#2026-10-23--drop-mission-control-editorial-studio-is-home)

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

## 2026-10-25 — Core promise: post consistently, in your own voice, with little effort

**Decision:** The product's main job is three things together: the user posts
on LinkedIn every week, the posts sound like them (not AI slop), and it takes
little of their time or effort. Research, features and positioning are judged
against these three.
**Why:** The user research (two desk reports, 2026-10-25) kept returning to
the same causes of going quiet: no time, blank page, and drafts that don't
sound like the person. Staying lean means one promise, not a list of features.
**Alternatives considered:** A comment helper (drafting comments on prospects'
posts). Parked, not rejected: revisit after the core promise works.
**Status:** active

## 2026-10-28 — Less effort each week: a one-line weekly answer, review one draft at a time

**Decision:** The weekly question is answered in the strip at the top of
Studio: type a line, press Enter, then save the notes Minions took from it in
one click (notes the privacy check flags still open in the full editor). The
optional follow-up fields leave the card. Studio opens on the drafts waiting
for review, its arrows step through only those, and a published or scheduled
draft offers the next one. The first draft Minions wrote is now kept on the
first edit, so how much authors rewrite can be measured.
**Why:** Our own data (2026-10-28): only 2 workspaces ever answered the weekly
question, and 42 of 75 drafts sat unreviewed. The Reddit research says
consistent posters jot short notes and batch their posting, and that
perfectionism stops people.
**Alternatives considered:** Saving notes without the author's confirmation
(drops the phase 6 rule that the author confirms; not needed yet). Emailing the
question (reverses D16; still a separate call).
**Status:** active

## 2026-10-28 — At most 10 unused ideas; ask for pasted posts when there's no own material

**Decision:** At most 10 unused ideas wait in a workspace. Finding ideas stops at 10, and one run adds only what still fits. When the author adds their own material (the weekly question, a story session, pasted posts), the oldest waiting ideas are discarded to make room, news ideas before their own. A workspace with none of the author's own material sees one card in Studio: "paste 2–3 posts or notes you have written". Minions makes notes from them that the author keeps or drops; ideas start from those notes, and the pasted text becomes a voice sample. The card goes away for good once something is saved.
**Why:** Unused ideas piled up to 28 in workspaces nobody drafted from, because a run could add several ideas past the old limit of 15. Seven workspaces had none of their own material, so their drafts came from news in a generic voice. The Reddit study found that people's voice comes from what they already wrote, and pasting old posts is less work than answering questions.
**Alternatives considered:** keeping 15; asking those workspaces more questions (the story bank already did, and they didn't answer).
**Status:** active

## 2026-11-09 — Reviewers who post by hand can mark a draft as posted

Some people copy the post into LinkedIn themselves instead of letting Minions
publish it. The review panel now has a "Mark as posted" button beside Approve
& publish and Schedule. It records the draft as out on LinkedIn (it moves to
Published and counts as posted) and sends nothing anywhere. It is not offered
for a scheduled draft; cancel the schedule first. Rejected: making these users
press Approve & publish, which would post a duplicate on LinkedIn.

## 2026-11-10 — Cover look is a basic, with five ready-made themes

**Decision:** Cover look moves out of Advanced onto the Brand basics as a sample cover and five one-tap themes (Graphite, Ivory, Midnight, Forest, Classic). New workspaces start on Graphite: quiet grey, one blue accent. Photo, cut-out, byline, illustration and custom colours stay on a "Photo and more" page. The reader's role and company now sit on the "Who you write for" card.
**Why:** Every post carries a cover, so how it looks is something every user sees on day one, not an optional extra. Themes are tuned to read on a phone, so a user never picks colours that fail. Role and company are how a reader recognises themselves, and they are two short fields.
**Alternatives considered:** Keeping the old teal and coral as the default (looks dated next to the redesign).
**Status:** active


## 2026-11-10 — Ask for the weekly update when a post is approved

**Decision:** Right after a reviewer schedules a post, one quiet line asks "Anything new since last week?". The answer becomes saved notes in one more tap, and the screen says they are being turned into new post ideas. "Not now" hides it without skipping the week. Still in-app and text-only (D16); no email.
**Why:** The weekly question only helps people who open the app in the right week, and few do. Approving a post is the moment the user is already in the app and thinking about their work, so it is the cheapest time to keep their experience current. Saying what the note does ties the answer to a visible result.
**Alternatives considered:** Email reminders (reach people who skip the app, but reverse D16 and need a sending service; left for later if this does not move answers). Day-and-time planning at setup (not built yet).
**Status:** active


## 2026-11-10 — Ten image-led poster designs for social

**Decision:** Covers gain ten image-led designs: Highlight, Swiss, Sideways, Echo, Bold, Split, Magazine, Bento, Tagged and Neon. Each one is built around one big word or shape and a short headline, not a block of text. They join the normal cover rotation and the Studio picker. Because one cover is shared, they appear on LinkedIn as well as Facebook (and Instagram later). They use only the workspace's own colours, fonts, name and post copy. Tagged's stickers come only from the post's own short grid or list items, never invented.
**Why:** Facebook and Instagram reward posts that stop the scroll with an image, and the old designs read as text cards. More distinct designs also keep a feed from looking repetitive.
**Alternatives considered:** Separate covers per channel (doubles render and review work for one post; can revisit when Instagram publishing exists).
**Status:** active

## 2026-11-10 — Short, image-led captions for Facebook, and an Instagram caption
- **Facebook:** the caption under the cover opens on the post's hook and stays under 110 words; the image carries the idea. The link comment is one plain line ("Read the full article: <url>") instead of the old stock "👉 … operational field guide" line.
- **Instagram:** every new draft gets its own caption (topic words in the first 125 characters, no link, 3 to 5 specific hashtags). Studio shows it as an Instagram tab next to Facebook, to copy and post by hand with the cover, until Instagram publishing exists. A caption that breaks those rules is a warning, never a reason to hold a draft.
- **Why:** the user wants Facebook and Instagram posts "image heavy, not text heavy"; see docs/research/facebook-instagram-posts-2026-11-10.md.

## 2026-11-10 — Instagram gets the whole carousel; every carousel keeps its pages as images

**Decision:** each carousel render stores every page as a JPEG next to the
LinkedIn PDF. When the carousel is on, the Studio's Instagram tab shows the
whole deck (cover first) to post by hand, instead of the single cover.
**Why:** carousels suit text-led B2B posts on Instagram best (swipes, saves and
sends), and Instagram and Facebook post images, not PDFs. The files are also
what a later Facebook multi-photo or Instagram publisher needs.
**Partly supersedes:** 2026-09-29 "store only the PDF". Pages are stored again,
as JPEGs, which cost far less than the PNGs did.

## 2026-11-10 — Minions posts to Instagram for you

**Decision:** Instagram is a fifth channel, off by default. A workspace connects it with one button ("Use my Facebook Page"), which uses the Instagram professional account linked to its connected Facebook Page; there is nothing to paste. Once it is on, every approved post also goes to Instagram after the blog, LinkedIn and Facebook: the carousel when the post has one (up to 10 pages), otherwise the cover, with the Instagram caption and no link. A post can be kept off Instagram like any other channel. If Instagram fails, the post still goes out everywhere else and the alert says why.
**Why:** the user asked for Instagram publishing; posting by hand from the Studio was a stopgap (2026-11-10 captions entry). Going through the Page avoids a second Meta sign-in.
**Alternatives considered:** a personal Instagram profile (Meta allows API posting only to professional accounts linked to a Page); a separate Instagram sign-in (more steps, same Meta permissions).
**Status:** active. Needs Meta's `instagram_content_publish` permission on the Page token; for workspaces other than the app's own admins, Meta app review.

## 2026-11-10 — Choose Carousel or Single poster for Instagram, and the last choice sticks

**Decision:** when a draft has a carousel, the Instagram tab in Studio offers "Carousel" or "Single poster". The reviewer's pick holds for that draft and becomes the workspace's default, so drafts nobody opens (automated posts) go out the same way. With no pick yet, Instagram gets the carousel. With no carousel, it gets the single poster. The choice is separate from LinkedIn's carousel switch.
**Why:** the user asked for a clear choice, kept for automated posts. Before this, Instagram silently followed the LinkedIn switch.
**Partly supersedes:** 2026-11-10 "Instagram gets the whole carousel": now it's the default rather than the rule.
**Status:** active. Carousels are still never made automatically (D19), so automated drafts without one get the single poster.

## 2026-11-10 — Pick cover layouts and carousel designs by their picture

**Decision:** Studio shows cover layouts and carousel designs as picture tiles, not lists of descriptions. Each tile is a sample drawn once with demo copy. Tapping one redraws the post, and Undo brings back the one before. Up to four layouts that suit the post come first, with "See all" for the rest. Layouts the cover can't be drawn in are hidden instead of greyed out. The Carousel / Single image choice for LinkedIn and Instagram is one segmented switch.
**Why:** the user asked for pickers that work the way Apple's do. Busy founders choose by eye, and reading 26 descriptions was work. Samples instead of per-post previews keep the picker instant and cost nothing per draft (the user's call, 2026-11-10).
**Status:** active.

## 2026-11-10 — Sticker covers carry the post's own points as stickers

**Decision:** the Sticker cover layout shows up to two sticker pills taken from the post's own points (grid labels, else list items). It never brings back an audience label (2026-09-25). The picker tile is drawn the same way, so what you pick is what you get.
**Why:** a real Sticker cover had no stickers, so it looked like Headline and the picker tile promised more than the cover delivered.
**Status:** active.

## 2026-11-11 — A post that failed on one platform says so

**Decision:** when a post goes out but a platform refuses it (LinkedIn token expired, Instagram or Facebook error), the dashboard shows "Partly posted · LinkedIn failed" in the list, on Today and on the post's own screen with the platform's reason. It no longer reads a plain "Posted". There is no Telegram alert any more; the dashboard is the one place failures show.
**Why:** a post with an expired LinkedIn token showed "Posted" while only Facebook and Instagram had gone out, and nobody was told (the user, 2026-11-11: "if one platform failed to post we need to show that").
**Status:** active.

## 2026-11-11 — Poster titles are short and punchy

**Decision:** a poster's title is the short cover line (3-6 words) whenever one says plainly what the post is about. It no longer has to beat the long post title, which always read as clear and so always won. The long title is only used when no short line works.
**Why:** every poster carried the whole post title (11 words), which is too long to read in a feed (the user, 2026-11-11: "all our poster title is becoming lengthy that should be short but punchy").
**Status:** active.

## 2026-11-18 — Talk instead of type on the update boxes

**Decision:** the boxes where people give an update (Quick draft, the weekly question, "Anything new since last week?" after approving, and adding an experience on Brand) have one mic button. Tap, talk, and the words appear in the box live after anything already typed; tap again to stop, then edit and send as usual. It uses the browser's own free speech recognition in the browser's language, so it costs nothing and needs no setup. Where a browser has none (Firefox), the mic isn't shown.
**Why:** the user asked for free voice dictation so people can give updates instantly; busy founders find speaking a one-line update easier than typing it, especially on a phone. A paid transcription service was not chosen because the browser one is free and good enough for short updates.
**Status:** extended 2026-11-18 (see "Talk instead of type in every text field").

## 2026-11-18 — Talk instead of type in every text field

**Decision:** the mic is no longer limited to the update boxes. Every free-text field in the app shows a mic inside it while it has focus; talking types into that field after what is already there. It never appears on password, email, link or number fields. The four update boxes keep their always-visible mic. While listening, the mic turns solid blue with moving sound bars and a soft pulse, so it is obvious it is on.
**Why:** the user asked for voice everywhere people type, a clearer mic, and a simple animation while it listens.
**Status:** active.

## 2026-11-18 — Bangladesh time for every user; stop button while dictating

**Decision:** Every date and time the app shows is in Bangladesh time (Asia/Dhaka) or the workspace's own timezone (Asia/Dhaka by default), never the viewer's device clock. The Weekly Pulse card no longer offers "Use <your browser's timezone>". While dictating, a stop button sits beside the mic.
**Why:** The team and tenant zero run on Dhaka time; a device on another zone showed different post times than the schedule used, and the pulse prompt invited switching away. A separate stop button makes it obvious how to end dictation.
**Alternatives considered:** Following each viewer's device timezone (rejected for now: one shared clock is simpler while all users are on Bangladesh time).
**Status:** active

## 2026-11-19 — The launch is a series of three films

**Decision:** Post Studio launches with three music-only films, one a week, each in its own style and with its own music: "Write" (the whole product: one thing from your work becomes a post in your words, with a cover, and nothing goes out until you say yes), "Covers" (the built-in layouts), and "Yours" (bring your own design). Each film comes in 16:9, 4:5 and 9:16. All three end on the same card (logo, "Post Studio", one button, minions.getminions.ai), a "Next: …" tag and one shared signature sound. Length varies with what a film has to explain. Lines on screen are real app copy, and no customer numbers or results are claimed. Scripts: minions-marketing/post-studio-launch/SCRIPTS.md.
**Why:** The user wanted the series to open with what the product is, before its features. Explaining it clearly, the way Apple, Google and Stripe launch films do, matters more than a fixed length. A different style per film keeps a weekly series fresh, and the shared ending keeps it recognisable.
**Alternatives considered:** Two films with covers first (superseded: viewers would see a feature before knowing the product); one style for all three (rejected: three weeks of the same look tires the feed).
**Status:** active

## 2026-11-19 — The app launches as "Minions Post Studio", in two films

**Decision:** The product is named Minions Post Studio in marketing, with minions.getminions.ai as the link for now. It launches with two short Apple-style films, music only: film 1 presents the built-in cover layouts as the new feature, and film 2 presents bringing your own design as the answer to users who want their own look.
**Why:** Telling it as a sequence makes the custom designs read as listening to users, not as a fix for weak layouts.
**Alternatives considered:** One film covering both features; it would have had to belittle the built-in layouts to make the custom designs land.
**Status:** superseded 2026-11-19 by "The launch is a series of three films"

## 2026-11-19 — Users can bring their own cover designs

**Decision:** A workspace can paste its own cover design (HTML in a fixed, documented format). It is checked first and saved only if it fully matches the contract and is readable; otherwise nothing is saved and the user sees plain-word reasons. Designs belong to the workspace, up to 10. They alternate with the built-in designs, never two custom covers in a row; a "Use only my designs" switch turns the built-ins off. For carousels, the custom design is used on page 1 only.
**Why:** users wanted covers that look like their own brand. Checking before saving keeps broken or unsafe pastes out of the product.
**Alternatives considered:** a full browser renderer (rejected: slow, larger attack surface); per-login ownership (rejected: brand data is per workspace).
**Status:** active

## 2026-11-19 — Each workspace picks its cover font

**Decision:** The Brand page's Cover look card has a Font choice: Bricolage (default), Anton, Unbounded, Syne, Space Grotesk or DM Serif. It sets the headline, quote and big-number type on every new cover and carousel; the small text stays Plus Jakarta Sans. Covers already made keep the font they were made with. Custom designs may use any of these fonts by name. All are free for commercial use (SIL Open Font License).
**Why:** the user wanted modern display type like the paid fonts in a Pinterest reference (Trapvoid, Gothif, Neue Monique, After, Bletro, Newblack, Quinn), configurable per workspace. Those are commercial; these free fonts give the same range (condensed, wide, quirky, technical, editorial) with no licence cost.
**Alternatives considered:** buying the reference fonts (licence cost and terms per workspace); letting users upload any font (licensing and safety risk; v2 at most).
**Status:** active. Supersedes the shared-type-system part of "Covers use Bricolage Grotesque and Plus Jakarta Sans" (2026-11-09).

## 2026-11-19 — Custom designs take the workspace's theme colours

**Decision:** A pasted or imported cover design must take its colours from the workspace's theme: every text colour, the cover's background and every background behind text use the theme's ink, paper, accent and secondary colours (gradients of them are fine). Icons, lines and shapes may keep their own colours. A design that uses fixed colours there fails the check with a plain reason and is not saved. Designs saved before this rule keep working.
**Why:** the user wants every cover to follow the brand theme, so changing the theme recolours custom designs too and the highlighted word always matches. A design tested with fixed blues kept its blues on an Ivory workspace and showed an orange highlight word, which looked broken.
**Alternatives considered:** allowing fixed colours as long as text is readable (the old rule; designs drifted from the brand); recolouring fixed colours automatically (guesswork, unpredictable results).
**Status:** active.

## 2026-11-19 — Custom design previews show the brand's own photo and cut-out

**Decision:** When someone checks a custom design, the preview draws the brand's own headshot and cut-out from the Brand page. If the brand has none, a grey figure stands in, and one line says to add them. A design must say how each picture fits (object-fit:cover for the headshot, object-fit:contain for the cut-out), or it is refused with a plain reason. The instructions explain what each picture is and where it goes, and that the cover must look complete without them.
**Why:** the old preview drew a grey box where the person goes, so neither the user nor their design agent could judge the layout, and a box without a fit rule stretched the person on real covers.
**Alternatives considered:** keeping the grey box (unjudgeable); fitting pictures automatically whatever the design says (hides the problem from the designer).
**Status:** active.

## 2026-11-19 — Reviewers can pick a saved design for one post in the editor

**Decision:** The post editor's layout picker shows the workspace's saved designs as named tiles, drawn live with the post's own words, in front of the built-in layouts. Clicking one redraws that post's cover in the design. Only an active design of the same workspace can be picked, and a post that doesn't fit the design gets a plain reason instead of a broken cover. The automatic rotation is unchanged.
**Why:** a design used only by the rotation could not be chosen for the post where it fits best, and a cover switched away from it could not be switched back.
**Alternatives considered:** rotation only (no control per post); a separate "Your designs" row (two pickers for one choice).
**Status:** active.

## 2026-11-19 — A cover falls back to the default font before losing words

**Decision:** When a post's words don't fit a layout in the workspace's cover font, the cover is drawn in the default font (Bricolage) instead. Order: keep the words first, then the brand's font, then the illustration; shorter copy comes only after both fonts fail. Custom designs keep their own fonts. A note on the cover records the fallback.
**Why:** with a wide font like Unbounded, switching a draft to Headline failed outright ("No cover copy fits") although the same words fit in the default font.
**Alternatives considered:** shortening the headline first (the reviewer's words matter more than the font); refusing the layout (leaves the reviewer stuck).
**Status:** active.

## 2026-11-20 — A new workspace opens with three posts; Autopilot comes after a week and needs LinkedIn

**Decision:** A new workspace gets its first post plus two more drafted in the background from other angles, so the dashboard opens with three to review. New workspaces start on Review first; Autopilot is offered after the first week and only works while LinkedIn is connected and healthy. With Autopilot on, tomorrow's posts are drafted ahead and scheduled into their slots without review (a post below the bar still waits for review). There is no daily drafting cap.
**Why:** one post on day one looks empty and a missed slot looks broken; trust comes from seeing real posts before letting any go out unseen, and an Autopilot with no LinkedIn would look busy while building nothing.
**Alternatives considered:** Autopilot from day one (posts go out before the user has seen what Minions writes); Autopilot to the blog alone (not the product's goal: LinkedIn authority); a separate small drafting budget for the starter set (no cap needed now).
**Status:** active. Starter set built (task 107); draft-ahead built (108: slots drafted 24h ahead, Autopilot schedules at the slot time, Review first waits, Autopilot offered on Today after a week); LinkedIn check built (109): Autopilot can't be turned on without a working LinkedIn connection, a lapsed token sends Autopilot drafts to review, and Today shows one Connect/Reconnect line.

## 2026-11-22 — Autopilot means autopilot: no checks, no review, the next 3 days scheduled

**Decision:** A workspace on Autopilot has every post drafted and scheduled for the next 3 days (a testing value; the plan was 7), with no claims check, no below-bar hold and no review. Turning Autopilot on is the user's choice to trust the posts; a user who wants to review turns it off. The only thing that still stops a post is a LinkedIn connection that cannot post. Review first keeps at least the next 3 slots drafted (still capped at 5 unreviewed). The Autopilot switch should carry a short card on its pros and cons.
**Why:** the user found a week-old workspace with one draft ready and a post held for "unbacked facts" even though Autopilot was on, which looked like the product not working. "Autopilot with review" is neither.
**Alternatives considered:** keeping the claims check as a hold on Autopilot (the 2026-11-20 rule; users read it as a bug); scheduling a post the user rejected after repeated cancels (publishes what they said no to).
**Status:** active. Supersedes the "passes every check" and "below-bar always waits" parts of 2026-11-20 for Autopilot workspaces. Built in task 121; each post is scheduled onto its own day by itself, so it shows on the week rail with no user action.

## 2026-11-26 — Drafting is always on: the choice is Review first or Autopilot

**Decision:** There is no "I'll draft myself" option and no Automatic drafting on/off switch. A workspace always gets drafts for its publishing pace; the owner chooses only whether they wait for review (Review first) or go out on their own (Autopilot). Saving a pace turns drafting on. A workspace that is full for the month shows "Monthly limit reached (n of N). Drafting resumes <date>" instead of promising a next draft.
**Why:** Autopilot with drafting off did nothing, and a drafting switch beside the mode choice read as two settings for one idea. The owner said writing your own is not needed. A silent monthly stop looked like the product not working (BSSE 1610 had no drafts from 22 Nov).
**Alternatives considered:** keeping the switch and greying Autopilot when it is off (two controls for one idea); a third "write my own" mode (owner: not needed).
**Status:** active. Built in tasks 128-129. Workspaces whose drafting is still off stay off until their owner saves a pace or taps "Save & turn on". BSSE 1610's monthly allowance was raised to 30 by hand (assets_per_month_override); plan limits themselves are unchanged.

## 2026-11-26 — Monthly post limits: Starter 30, Growth 45, Scale 60

**Decision:** A workspace can draft 30 posts a month on Starter, 45 on Growth and 60 on Scale (was 8, 20 and 60). The order Starter < Growth < Scale is kept.
**Why:** Starter's 8 stopped Autopilot workspaces mid-month (BSSE 1610 hit 9, Rakibul 8) and the owner wants about 30 posts a month as the normal pace.
**Alternatives considered:** Starter 30 with Growth left at 20 (Starter would exceed the paid tier); all plans at 30 (Scale would lose its higher limit).
**Status:** active. Built in task 130. BSSE 1610's own override of 30 stays and is now the same as Starter.
