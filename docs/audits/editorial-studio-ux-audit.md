# Editorial Studio Review Page (Desktop & Mobile)

## Anti-Pattern Verdict
**Significant Issues**

- **The "Homework" Anti-Pattern (Teacher Scolding / Compliance Gate)**: The claims verification system (`ClaimsGate`) and `DraftChecks` present the busy executive with an unrequested proofreading checklist ("2 facts aren't checked yet", "1 sentence is long. Shorter ones read faster"). Treating a business owner like a student submitting an essay creates resentment and fatigue. Located in `ReviewDecision.tsx`, `ClaimsGate.tsx`, `DraftChecks.tsx`.
- **Paradox of Choice / Hick's Law Violation**: Presenting 23 layout tiles on the cover and 7 design themes on the carousel forces an executive into creative-director decision paralysis rather than autonomous content delivery. Located in `CoverImageCard.tsx`, `CarouselCard.tsx`.
- **Button Explosion & Scope Ambiguity**: 42 buttons on a single review screen, including 4 differently scoped "Edit" buttons (`Edit text` in sidebar, `Edit post` in Captions, `Edit` on cover, `Edit wording` on carousel). Located across `ReviewDecision.tsx`, `CoverImageCard.tsx`, `SocialVariantTabs.tsx`, `CarouselCard.tsx`.
- **Side-Tab Accent Border**: Thick accent borders (`border-l-4`) on card elements flagged by deterministic detector. Located in `MarkdownArticle.tsx`.

---

## Technical Audit Score (Impeccable Standards)

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility (A11y) | 2/4 | 42 interactive targets create heavy tab clutter; low-contrast subtle text on light backgrounds; missing explicit ARIA expanded relationships on several custom accordions. |
| 2 | Performance | 3/4 | Satori SVG cover previews load quickly (15–38 ms); full-size carousel images add network payload on initial render. |
| 3 | Theming & Tokens | 3/4 | Strong brand token discipline (`text-ink`, `text-muted`, `bg-surface`); minor hard-coded border colors. |
| 4 | Responsive Design | 2/4 | Mobile layout requires scrolling through 3,500px of vertical stack before reaching the decision panel or relying on an anchoring action bar. |
| 5 | Implementation Integrity | 3/4 | Solid type safety and unit testing, but UX is overburdened by layer-upon-layer of sprint additions without holistic simplification. |
| **Total** | | **13/20** | **Acceptable (Significant UX Streamlining Required)** |

---

## ICP Reality & Mental Model

### Who They Are
- **Role:** Founder, agency CEO, managing partner, enterprise consultant (e.g. Parvej Shah, Founder of Minions.AI).
- **Context:** Managing clients, revenue, team firefighting, sales calls. They review social posts in fragmented micro-moments (between meetings, at airport gates, late evening on mobile).
- **Core Expectation:** "Minions is my autonomous thought leadership engine. I pay for outcomes, not a second job as an editor."
- **The Ideal Interaction (The 15-Second Nod):**
  1. Glance at the visual: *Looks sharp.*
  2. Glance at the hook & body: *Sounds like me and conveys my message.*
  3. One clear, uninhibited click: **Approve & Schedule**.
  4. Done.
- **The Current Experience (The Chore Gauntlet):**
  - They see "Post 3 of 20 waiting" (inbox guilt).
  - They are confronted with 42 buttons, 23 layout options, and 7 carousel styles.
  - They are warned that "2 facts aren't checked yet" with an open list of tasks asking them to tap each fact to confirm it is true.
  - They leave the page feeling fatigued, leading to draft accumulation (explaining why 20 posts are stuck in waiting).

---

## Priority Issues

### Critical (Blocks core task completion or creates extreme cognitive fatigue)

1. **The Compliance Check Gate ("Facts in this post" & "2 facts aren't checked yet")**
   - **What:** A yellow warning box in the primary decision sidebar stating "2 facts aren't checked yet. Open Details below and mark each checked, or edit the post," with an expanded accordion containing interactive buttons to verify individual sentences.
   - **Where:** `ReviewDecision.tsx:334-338`, `ClaimsGate.tsx`, `EditorialStudio.tsx:458`.
   - **Why it matters:** It stops the executive from taking quick action by implying the post is dangerous or incomplete without manual fact verification. A founder does not want to audit their own AI's factual grammar sentence-by-sentence.
   - **Heuristic violated:** Match between system and the real world & Recognition rather than recall.
   - **Design change:** Suppress the warning badge and collapse claims by default. The primary button ("Schedule for [Time]" or "Post Now") must remain confident and unblocked. Factual claims checking should be an optional background safety audit, not an upfront barrier.

2. **Action Ambiguity Across Four Competing "Edit" Buttons**
   - **What:** The page contains four different edit buttons with completely different scopes: `Edit text` (in the sidebar), `Edit post` (on Captions), `Edit` (on the Cover), and `Edit wording` (on Carousel).
   - **Where:** `ReviewDecision.tsx:346`, `SocialVariantTabs.tsx:81`, `CoverImageCard.tsx:236`, `CarouselCard.tsx:223`.
   - **Why it matters:** When a busy user spots a typo in the caption and clicks "Edit text" in the sidebar, they are either jumped to an article editor or unexpectedly toggled into an edit state. They cannot build a reliable mental model of what button edits what asset.
   - **Heuristic violated:** Consistency and standards.
   - **Design change:** Eliminate "Edit text" from the sidebar. The sidebar should handle only *Decision & Distribution* (When, Where, Post). Each content card (Cover, Carousel, Captions) owns its own localized, contextual edit trigger.

3. **Overchoice in Cover and Carousel Generation (23 Layouts & 7 Themes)**
   - **What:** Exposing an expansive picker of 23 cover layouts with a `See all 23` button and 7 carousel themes (Editorial, Bold, Minimal, Swiss, Aurora, Bento) on every review page.
   - **Where:** `CoverImageCard.tsx:34-41`, `CarouselCard.tsx:244-255`.
   - **Why it matters:** Hick's law dictates that decision time increases logarithmically with the number of choices. An executive should not be picking between "Aurora" and "Swiss" per post; the AI should pick the optimal style defined in their `/brand` settings. Exposing 30 styling variations makes the user feel responsible for visual art direction.
   - **Heuristic violated:** Aesthetic and minimalist design.
   - **Design change:** Default to the single best layout chosen by the brand engine. Provide a compact, progressive "Shuffle style" or "Switch layout" action without occupying vertical card height with full carousel pickers.

---

### Major (Significant friction, task hesitation, or clutter)

4. **Sidebar Action Clutter (5 Competing Action Buttons)**
   - **What:** The decision sidebar stacks up to five actions: `Post today at 21:00`, `Edit text`, `Post now instead`, `Not this one, delete it`, and `Mark as posted`.
   - **Where:** `ReviewDecision.tsx:340-353`.
   - **Why it matters:** The eye has no clear visual hierarchy. The user must pause and read through five options before deciding how to post.
   - **Heuristic violated:** Aesthetic and minimalist design & Flexibility and efficiency of use.
   - **Design change:** Establish a single dominant primary CTA: `Approve & Schedule` (with a chevron/dropdown or secondary link for "Post now instead"). Demote "Delete" and "Mark as posted" to a subtle overflow menu or quiet footer links.

5. **AI Self-Justification ("Why this wording")**
   - **What:** A disclosure accordion titled `› Why this wording (2)` explaining the AI's linguistic heuristics.
   - **Where:** `CoverImageCard.tsx:307-319`.
   - **Why it matters:** Busy professionals judge copy by reading it, not by reading the AI's defense of its own copy. Exposing prompt metadata clutters the UI and distracts from the core review task.
   - **Heuristic violated:** Aesthetic and minimalist design.
   - **Design change:** Remove the "Why this wording" disclosure from the review view.

6. **"1 sentence is long. Shorter ones read faster." (Grammar lecturing)**
   - **What:** `DraftChecks` outputs subjective readability critiques directly under the decision area.
   - **Where:** `DraftChecks.tsx:32-45`.
   - **Why it matters:** The AI wrote the draft. Presenting the AI's self-criticism to the user as a problem they must solve feels unprofessional.
   - **Heuristic violated:** Error prevention & Match between system and real world.
   - **Design change:** Filter out stylistic advice. Only critical factual red-flags (if any) should ever surface to the user.

---

### Minor (Degraded experience, unnecessary clicks)

7. **Format Duality (Cover Card vs. Carousel Card)**
   - **What:** Both Cover and Carousel appear as two massive full-width cards sequentially, even when the post format is set to "Carousel" (where the cover is just slide 1) or "Single poster" (where the carousel is unused).
   - **Where:** `EditorialStudio.tsx:392-401`.
   - **Why it matters:** It forces redundant vertical scrolling through two large graphic preview sections that represent the same post.
   - **Heuristic violated:** Recognition rather than recall.
   - **Design change:** Condense the visual preview into a unified "Visual Asset" card where toggling between Single Poster and Carousel morphs the preview seamlessly.

8. **"Post 3 of 20 waiting" Inbox Guilt**
   - **What:** Prominent header text highlighting a backlog of 20 waiting posts.
   - **Where:** `EditorialStudio.tsx:348`.
   - **Why it matters:** Prominently reminding busy executives of an uncompleted queue induces anxiety.
   - **Heuristic violated:** Visibility of system status.
   - **Design change:** Reframe to positive momentum: "Draft 3" with clean navigation controls, or offer a "Batch Approve" option for trusted feeds.

---

### Cosmetic (Visual polish)

9. **Side-tab thick border in markdown previews**
   - **What:** `border-l-4` side border on cards/blockquotes.
   - **Where:** `MarkdownArticle.tsx:110, 212`.
   - **Why it matters:** Generic AI aesthetic tell flagged by design detector.
   - **Design change:** Use subtle tint background or standard 1px border.

---

## Heuristic Verdicts

| Usability Heuristic | Verdict | Deciding Finding |
|---------------------|---------|------------------|
| Visibility of system status | Strained | Backlog anxiety ("20 waiting") & unverified claims state |
| Match between system and the real world | **Broken** | Compliance Gate / Teacher Scolding ("2 facts aren't checked yet") |
| User control and freedom | Holds | Undo layout switches, schedule cancellation, and safe draft resets work cleanly |
| Consistency and standards | **Broken** | Action Ambiguity across 4 competing "Edit" buttons |
| Error prevention | Strained | Subjective grammar nitpicks disguised as risks |
| Recognition rather than recall | Strained | Visual disconnect between Cover, Carousel, and Channel captions |
| Flexibility and efficiency of use | **Broken** | No rapid 15-second approve pathway; 42 buttons per screen |
| Aesthetic and minimalist design | **Broken** | 42 buttons, 23 layout tiles, 7 design templates, exposed AI metadata |
| Help users recognize, diagnose, and recover from errors | Holds | Publish failure banners and retry triggers are clear |
| Help and documentation | Holds | Succinct descriptions of carousel and channel formats |

---

## Cognitive Walkthrough: "Fast 30-Second Post Approval"

| Step | Goal / Action | Q1: Motivation | Q2: Visibility | Q3: Understanding | Q4: Feedback | Result |
|---|---|---|---|---|---|---|
| 1. Arrive on Page | See post to approve | Yes | Yes (Page loads) | Hesitation: 42 buttons and 3 long cards compete for attention | N/A | **Hesitation** |
| 2. Check Visual | Confirm image/slides look good | Yes | Yes (Cover/Carousel displayed) | Hesitation: Sees 23 layouts and 7 styles; wonders if they need to customize | N/A | **Hesitation** |
| 3. Read Caption | Confirm words sound authentic | Yes | Yes (Captions card) | Yes (Clear text) | N/A | **Pass** |
| 4. Attempt Approval | Click primary action | Yes | Blocked by doubt: Yellow alert "2 facts aren't checked yet" above button | Confusion: Can I click "Post today at 21:00" safely or do I need to check facts first? | N/A | **Failure / Friction** |
| 5. Review Facts | Click facts to dismiss warning | No (Chore) | Yes (Accordion) | Annoyance: Having to tap obvious facts to clear a warning | Status updates to "Checked" | **Failure (Chore Tax)** |
| 6. Final Click | Click "Post today at 21:00" | Yes | Yes | Yes | Toast appears: "Scheduled" | **Pass** |

**Summary:** The core task requires 6 steps and 3 moments of hesitation/friction instead of a seamless 2-step review.

---

## Positive Findings (What to Protect)

- **Channel-faithful minimal previews:** The recent simplification of the LinkedIn, Facebook, and Instagram caption tabs (clean author badge, direct typography, no fake like/comment widgets) provides high-fidelity realism without distraction.
- **Fast tile rendering:** Cover previews render in 15–38 ms via Satori SVG, providing instantaneous layout switching when requested.
- **Unified format model:** LinkedIn and Instagram sharing the same single-poster vs. carousel decision respects platform symmetry.
- **Predictable scheduling slots:** The smart slot picker (`nextFreeSlot`) automatically suggests optimal posting times without requiring manual date-picker fiddling.

---

## Recommended Actions (Roadmap in Priority Order)

1. **Silence the Teacher (Dismantle the Compliance Gate):** Remove the yellow "facts aren't checked yet" banner from above the primary button. Keep claims checking strictly collapsed as an optional reference.
2. **Unify the Action Hierarchy:** Make the primary button in the sidebar the unquestioned focal point: a prominent `Approve & Schedule` button with a subtle `Post now` secondary action.
3. **Consolidate Edit Scopes:** Remove `Edit text` from the sidebar. Keep edits strictly contextual (edit cover on the cover card, edit post on the captions card).
4. **Hide the AI's Inner Monologue:** Remove `Why this wording` and readability critiques ("1 sentence is long").
5. **Declutter Style Pickers:** Default to the brand's recommended cover and carousel styles; collapse the 23-layout and 7-theme galleries behind a clean "Change style" popover/drawer rather than occupying prime vertical screen real estate.
