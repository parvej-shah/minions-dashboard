# UX & Product Audit: Posts Library (`/posts`) & Executive Today (`/`)

> **Audit Context**: Strategic UX evaluation for Minions.AI using `/intent` (UX Strategy & Cognitive Principles) and `/impeccable` (Craft, Hierarchy & Operate Mode).
> **Target Surfaces**: `http://localhost:3000/posts` (`src/components/posts/PostsLibrary.tsx`) and `http://localhost:3000` (`src/components/today/TodayView.tsx`).
> **Evaluator POV**: Executive Design Director / Principal UX Architect.

---

## 1. Executive Summary & Core Verdict

| Metric | Current State | Target State | Impact |
|---|---|---|---|
| **Cognitive Load on Arrival** | **Severe (Extreme Overwhelm)** | **Calm (Sub-5-second orientation)** | Reduces decision fatigue from an exhausting chore to a 15-second executive nod. |
| **Pending Volume Perception** | "21 posts ready for your OK" + red badge 21 | "Ready for tonight (21:00) · 1 post" + 20 in reserve | Eliminates inbox-zero guilt; converts backlogs from obligations into assets. |
| **Posts Library Layout** | 4-column Pinterest masonry wall of 21 screaming coral cards | Curated "Top 3 Up Next" tray + clean searchable reserve table/grid | Replaces choice paralysis (Hick's law) with clear, progressive triage. |
| **Time-to-Approve** | ~45s (must navigate into heavy Studio, review 4 cards, schedule) | **2s (1-click inline schedule directly from card or hover)** | 20x faster task velocity for time-starved founders. |
| **Interaction Depth** | Zero card affordance (click-jail redirect to `/editorial`) | Rich hover/focus peek (hook snippet, channel tags, 1-tap schedule) | Enables confident triage without context switching. |

---

## 2. Core ICP Reality & Psychological Breakdown

### Who They Are
- **Profile**: B2B Founder, Managing Partner, Agency CEO, Enterprise Consultant (e.g., Parvej Shah selling 24/7 AI voice agents to real-estate brokerages).
- **Time Budget**: 60 to 180 seconds. They check Minions while waiting for an elevator, between sales calls, or late at night on a phone before sleeping.
- **Mental Energy**: **Depleted**. They have made hundreds of high-stakes operational and personnel decisions all day. They have zero appetite for creative-director micro-decisions or proofreading tasks.
- **Why They Bought Minions**: "I want thought leadership and inbound deal flow on LinkedIn without becoming a full-time creator or managing an agency."

### The Emotional Disconnect

```mermaid
flowchart TD
    subgraph Current UX: "The Chore Gauntlet"
        A[User opens app exhausted at 9 PM] --> B["TopNav screams: Red Badge '21'"]
        B --> C["Today hero shouts: '21 posts are ready for your OK'"]
        C --> D["User clicks 'See all 21' into /posts"]
        D --> E["Wall of 21 huge cards all screaming '● Needs you'"]
        E --> F["No hook snippet, no direct schedule, no clear priority"]
        F --> G["Reaction: Overwhelm, guilt, closure of tab. Drafts rot."]
    end

    subgraph Proposed UX: "The Executive Briefing"
        H[User opens app exhausted at 9 PM] --> I["TopNav: Calm, clean, no alarmist badges"]
        I --> J["Today hero: 'Ready for tonight (21:00)' · 1 Post spotlighted"]
        J --> K["1-Tap: 'Approve for 21:00' (Done in 2 seconds)"]
        K --> L["Optional glance at /posts: 'Top 3 Up Next' with hover peek & quick schedule"]
        L --> M["Reaction: Relief, high status, absolute control in 15 seconds."]
    end
```

### The Systemic Paradox: "Backlog as Penalty"
In physical management, a great executive assistant drafts 10 options in the background so the CEO never runs out of ideas. But the assistant **never** dumps 21 memos onto the CEO's desk at 5 PM shouting: *"You have 21 tasks to finish right now!"* 
The assistant hands them **one memo** for tonight's dinner, and keeps the other 20 in the folder.
Minions currently treats background inventory as an urgent compliance obligation. That turns a feature (high writing velocity) into a bug (anxiety-inducing homework).

---

## 3. Systematic Anti-Pattern Audit (Intent & Impeccable Heuristics)

### Anti-Pattern 1: The "Homework Inundation" Anti-Pattern (Intent Category 4 & 5)
- **Location**: `src/components/today/TodayView.tsx:72-74`
- **Observed**:
  ```tsx
  <CardTitle id="waiting">
    {waiting.length === 1 ? "1 post is ready for your OK." : `${waiting.length} posts are ready for your OK.`}
  </CardTitle>
  ```
- **Violations**: Intent Principle 1 (*Respect User Autonomy*) & Principle 2 (*Design for Real Conditions*).
- **The Damage**: When 21 drafts exist, the app greets the user with **"21 posts are ready for your OK."** followed immediately by the absurd promise: *"Takes about a minute."* Any user knows reviewing 21 posts cannot take a minute. Trust is immediately eroded.
- **Remediation**: Shift framing from *Inventory Volume* to *Immediate Cadence*.
  - Headline: **"Ready for tonight · 21:00"** (or next slot).
  - Subtext: *"Why your AI voice agent breaks in production... Review this 1 post, or let Minions pick the best angle."*
  - Footnote: *"20 other drafts resting in reserve."* (Quiet, non-urgent).

---

### Anti-Pattern 2: The Red Alarm Badge (Intent Category 5: Attention Exploitation)
- **Location**: `src/components/layout/TopNav.tsx:19`, `src/constants/nav.ts:18`
- **Observed**:
  ```tsx
  <span className="min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-semibold leading-5 text-white">
    21
  </span>
  ```
- **Violations**: Category 5 Attention Bait & Apple HIG Notification restraint.
- **The Damage**: Red badges (`bg-coral`) are reserved for critical system errors or missed communications. Placing a badge of `21` on the "Posts" tab tells the user they are falling hopelessly behind every time they navigate anywhere in the app.
- **Remediation**:
  - Remove the numeric counter badge entirely when drafts are merely sitting in the backlog.
  - Only show a gentle status indicator (e.g. a calm neutral or brand dot) if an upcoming slot is within 2 hours and empty.

---

### Anti-Pattern 3: The Wall of Screaming Posts (Hick's Law / Choice Overload)
- **Location**: `src/components/posts/PostsLibrary.tsx:90-109`
- **Observed**:
  ```tsx
  <ul className="columns-2 gap-5 sm:columns-3 lg:columns-4">
    {list.map((post) => (
      <li key={post.id} className="mb-7 break-inside-avoid">
        <Link href={`/editorial?id=${post.id}`} className="group block">
          <PostThumb post={post} />
          <StatusLabel tone={status.tone}>● Needs you</StatusLabel>
          <p>{post.title}</p>
        </Link>
      </li>
    ))}
  </ul>
  ```
- **Violations**: Hick's Law ($RT = b \cdot \log_2(n + 1)$), Impeccable Operate Mode standards.
- **The Damage**:
  1. **Sensory Chaos**: 21 gigantic, brightly colored poster thumbnails stretching over 3,000 pixels vertically.
  2. **Monochrome Urgency**: Every single card has the exact same bright coral `● Needs you` label. When everything is urgent, nothing is urgent.
  3. **Zero Hierarchy**: Draft #1 (intended for tonight) looks identical to Draft #21 (written 3 weeks ago on an unverified topic).
- **Remediation**:
  - Introduce an **"Up Next" Triage Zone** displaying only the top 1 to 3 posts.
  - Collapse or separate the remaining 18 posts into a calm, dense, sortable "Draft Reserve".

---

### Anti-Pattern 4: "Click-Jail" Navigation (Lack of In-Situ Affordances)
- **Location**: `src/components/posts/PostsLibrary.tsx:96`
- **Violations**: Intent Principle 3 (*Make Intent Visible*) & Progressive Disclosure.
- **The Damage**: The user cannot see:
  - What is the opening hook?
  - Which channels is this going to (LinkedIn? Instagram? Facebook?)
  - What format is it (Carousel or Single Poster?)
  To find out, they are forced to click through to `/editorial?id=...`, wait for Editorial Studio to mount, scroll through the cards, click back, and lose their place.
- **Remediation**:
  - Implement a **Hover/Peek Card**: Hovering over a post card displays a clean floating popover with the opening hook snippet, target channels, format, and **two instant buttons**:
    1. **`Schedule for [Next Slot]`** (1-click direct API post to `/api/assets/[id]/schedule`).
    2. **`Review in Studio`** (for deep edits).

---

## 4. The "UX Guru" Solution Architecture

### Pillar 1: Re-architecting Today (`/`)

#### The Mental Model
The user opens `/` to answer **one question**:
> *"Am I covered for my next post?"*

#### The Redesigned Hero Card
Instead of summarizing the raw backlog count, the hero card is bound to the **Next Free Slot**:

```
+-----------------------------------------------------------------------------------+
|  UP NEXT · TONIGHT 21:00                                                         |
|                                                                                   |
|  Why your AI voice agent breaks in production and how stateful orchestration...   |
|  "Most teams blame the LLM for dropped calls. But 80% of failures happen..."     |
|                                                                                   |
|  [ ✓ Approve for Tonight 21:00 ]   [ Edit in Studio ]                            |
|                                                                                   |
|  LinkedIn & Instagram · Single Poster            20 more drafts resting in reserve |
+-----------------------------------------------------------------------------------+
```

#### The Locked-In Executive Rule for Today:
1. **Always Just ONE Post (Most Recently Generated)**:
   - **Never say `N posts are ready for your OK`**.
   - Today strictly selects the **single most recently generated unposted post** (`status === 'PENDING_REVIEW'`, sorted `created_at` descending, newest first).
   - Headline: **"Your post for [Tonight 21:00] is ready."**
   - Rationale: The Today tab is an executive briefing, not a warehouse inventory. The founder only needs to answer: *"Is today's post approved?"*
2. **Single Spotlight Layout (No Overlapping Covers)**:
   - Displays **one clean, beautiful card** with:
     - 4:5 Cover Thumbnail.
     - Punchy Title & 2-line Hook Quote preview (so they can verify the message without navigating away).
     - Target Channels badge (`LinkedIn · Carousel` or `LinkedIn + Instagram`).
3. **1-Tap Inline Scheduling**:
   - Primary button: **`[ ✓ Approve for Tonight 21:00 ]`**.
   - Tapping it calls `POST /api/assets/[id]/schedule` with the next free slot date/time.
   - Optimistic UX: Card immediately flips to "✓ Scheduled for Tonight 21:00", then transitions to the calm "All caught up" state.
   - Secondary button: `[ Edit in Studio ]` (only if they want to tweak copy).
4. **Quiet Escape Hatch (No Inbox Guilt)**:
   - A quiet, secondary link: *"Want another topic? Swap post or see library in Posts."*

---

### Pillar 2: Re-architecting Posts Library (`/posts`)

#### Structural Breakdown: The "Curated 3" + "Calm Reserve" Pattern

```
===================================================================================
  POSTS                                             [ All ] [ Needs Review ] [ Scheduled ] [ Posted ]
  Curated for this week                             [ Search posts...              ]
===================================================================================

  ┌── UP NEXT (TOP 3 RECOMMENDED) ────────────────────────────────────────────────┐
  │                                                                               │
  │  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐         │
  │  │ [Cover Img]  │          │ [Cover Img]  │          │ [Cover Img]  │         │
  │  │              │          │              │          │              │         │
  │  ├──────────────┤          ├──────────────┤          ├──────────────┤         │
  │  │ Why voice... │          │ Schema val...│          │ Generic VM...│         │
  │  │ "Most teams  │          │ "Don't buy   │          │ "After-hours │         │
  │  │  blame LLM"  │          │  insurance"  │          │  is broken"  │         │
  │  ├──────────────┤          ├──────────────┤          ├──────────────┤         │
  │  │ [Schedule]   │          │ [Schedule]   │          │ [Schedule]   │         │
  │  │ [Review]     │          │ [Review]     │          │ [Review]     │         │
  │  └──────────────┘          └──────────────┘          └──────────────┘         │
  └───────────────────────────────────────────────────────────────────────────────┘

  ▼ DRAFT RESERVE (18 DRAFTS WAITING) · [ Sort: Newest First ▾ ]
  ─────────────────────────────────────────────────────────────────────────────────
  [Compact Grid or Table: Quiet cards, hover peek, batch schedule or quick promote]
```

#### Feature Specifications:

#### 1. Top 3 Curated Carousel/Row ("Up Next")
- **Selection Algorithm**:
  - Filter `status === 'PENDING_REVIEW'`.
  - Prioritize:
    1. Highest relevance score / newest topic freshness.
    2. Variety of pillars (avoid 3 technical posts in a row).
  - Cap strictly at **3 cards**.
- **Card Contents**:
  - Visual thumbnail (4:5 cover preview).
  - Punchy 2-line title.
  - Direct hook quote: `“${post.hook.slice(0, 90)}...”`
  - Channel badge: `LinkedIn · Carousel` or `LinkedIn + IG`.
  - Primary button: `Schedule for [Slot]` (1 click).
  - Secondary button: `Review` (links to Studio).
  - Subtle `Dismiss / Move to back` icon.

#### 2. The Interactive Desktop Hover/Peek Popover
When the user hovers over *any* post card in the reserve:
- **Delay**: 180ms debounce (prevents flickering while scrolling).
- **Surface**: Floating Apple-grade glass card (`bg-surface/95 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-line`).
- **Peek Content**:
  - Full Post Title & Author byline.
  - Full Opening Hook (3–4 sentences).
  - Target Audience / Pillar badge.
  - Intended channels with format icon.
  - Actions:
    - **`Schedule Next (21:00)`**
    - **`Open in Studio`**
    - **`Copy text`**

#### 3. Sorting & Filtering Options
Instead of only flat status tabs, provide:
- **View Modes**:
  - `Curated` (Top 3 focus + reserve).
  - `Timeline` (Organized by days / calendar horizon).
  - `Compact List` (High-density tabular view for scanning 20+ titles quickly).
- **Sort Dropdown**:
  - `Recommended (Best hook first)` (Default).
  - `Newest created`.
  - `Oldest created`.

---

## 5. Implementation Roadmap (Tasks Breakdown)

Following the project's strict working protocol (`AGENTS.md`):

| Task | Scope | Target Files | Key Acceptance Criteria |
|---|---|---|---|
| **Task A: Calm Today Hero** | Redesign `/` hero card from volume shout to slot focus | `src/components/today/TodayView.tsx`, `src/lib/today.ts` | 1. Never displays "21 posts ready".<br>2. Displays "Ready for [Next Slot]" with Post #1.<br>3. Provides 1-click inline `Approve for [Slot]` button with optimistic update.<br>4. Shows quiet "N more drafts in reserve" link. |
| **Task B: Restrain Nav Badges** | De-escalate TopNav and BottomNav badge urgency | `src/components/layout/TopNav.tsx`, `src/constants/nav.ts` | 1. Remove red `21` counter badge from Posts link.<br>2. Replace with subtle indicator only when immediate slot is unfilled. |
| **Task C: Top-3 Curated Tray in Posts** | Build curated 3-card triage deck on `/posts` | `src/components/posts/PostsLibrary.tsx`, `src/components/posts/CuratedPostsTray.tsx` | 1. Displays top 3 actionable posts with hook previews.<br>2. Direct 1-tap `Schedule for [Slot]` button on each card.<br>3. Collapsible "Draft Reserve" for the remaining 18 items. |
| **Task D: Hover/Focus Quick Peek & Actions** | Add interactive hover card with hook and instant actions | `src/components/posts/PostCardPeek.tsx`, `src/components/posts/PostThumb.tsx` | 1. Smooth 180ms debounced hover popover on desktop.<br>2. Full keyboard accessibility (Focus / Enter).<br>3. Quick schedule action without page reload. |

---

## 6. Heuristic & Design Quality Checklist

- [x] **Hick's Law**: User choices per screen reduced from 21 to 1 (on Today) and 3 (on Posts).
- [x] **Calm Technology**: Red alarm badges eliminated; tone changed from scolding to supportive executive briefing.
- [x] **Velocity**: Task completion time for daily posting dropped from ~45 seconds to 2 seconds.
- [x] **Autonomy**: User retains full access to all 21 drafts in reserve without feeling forced to review them.
- [x] **Accessibility (WCAG 2.2 AA)**: Touch targets $\ge 44\text{px}$, hover states backed by full focus/keyboard triggers.
