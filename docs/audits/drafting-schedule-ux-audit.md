# UX & Product Audit: Drafting Schedule (`/editorial?schedule=1`)

> **Audit Context**: Strategic UX evaluation for Minions.AI using `/intent` (Design Intent, Ethical Defaults, Cognitive Load) and `/impeccable` (Craft Floor, Visual Hierarchy, Operate Mode, Anti-Pattern Defenses).  
> **Target Surface**: `http://localhost:3000/editorial?schedule=1` (`DraftScheduleModal.tsx`, `ScheduleSettings.tsx`, `AutomaticDrafting.tsx`, `ContentPlanCard.tsx`).  
> **Evaluator POV**: Executive Design Director / Principal UX Architect.

---

## 1. Executive Summary & Core Verdict

| Dimension | Current State (`/editorial?schedule=1`) | Target State (The Executive Pace Engine) | Business & UX Impact |
|---|---|---|---|
| **Architecture & Surface** | Parasitic sheet modal mounted over a heavy post review engine (`/editorial?schedule=1`) | Dedicated calm surface (`/schedule`) + lightweight contextual drawer where needed | Eliminates context confusion; removes 3,500px of background DOM weight and dual scrollbars. |
| **Cognitive Load on Arrival** | **Severe (DevOps / CMS Admin Cockpit)** | **Effortless (Sub-10-second executive pacing)** | Transforms an exhausting technical chore into a confident 1-tap strategic commitment. |
| **Interaction Model** | 12 form fields, raw time spinners, interval math, technical status badges (`BELOW_BAR`, `TARGETED_HARVEST`) | 3 curated human rhythm presets ("Consistent 3x", "High Visibility 5x", "Custom") with 1-tap slots | Aligns with executive mental models; eliminates decision paralysis and arithmetic. |
| **Publishing Autonomy Logic** | Double negative: *"Publish without my review"* (warning gold switch, inverted boolean) | Affirmative outcome: *"Publishing Mode"* — `[Review First (Recommended)]` vs `[Autopilot]` | Eliminates hesitation and fear of accidental rogue posts. |
| **Save & Feedback Model** | Conflicting hybrid: Card 1 has manual Save; Card 2 auto-saves silently; Card 0 has "Save & turn on" | Unified auto-save with instant optimistic feedback or single confident primary action | Eliminates lost-state anxiety and confusing multi-button saves. |

---

## 2. The Core Architecture Question: Modal Sheet vs. Dedicated Page

### The Current Problem: "Parasitic Context-Hijack Modal"
In the current implementation, hitting `http://localhost:3000/editorial?schedule=1` loads the entire Editorial Studio under the modal:
1. It queries `/api/assets/[id]`, fetches full post copy, renders Satori cover image previews, parses 24 layout tiles, initializes carousel builders, and mounts 42 review buttons.
2. It drops a `DraftScheduleModal` (`variant="sheet"`, max width 768px) over the top.
3. If an executive visits from the Account Menu ("Posting schedule") or Today ("Set a schedule"), closing the modal leaves them **stranded on an arbitrary draft review screen** that has nothing to do with their intent.
4. If they expand the schedule's two internal accordions (*Preview upcoming drafts* and *Fine-tune your content plan*), the modal content balloons to over 1,400px of vertical height, triggering clumsy nested scrollbars (the modal body scrolling inside an already scrolling viewport).

### The Impeccable Craft Floor Verdict
Impeccable’s Craft Floor explicitly commands:
> **"Refuse: A modal for a task that needs neither interruption nor protected focus."**

A schedule is **strategic infrastructure** — not an ephemeral interruption. Forcing it into a sheet modal treats the lifeblood of the user's publication cadence like a transient confirmation dialog.

### The Architectural Recommendation
1. **Promote Schedule to a Dedicated Route (`/schedule` or `/settings/schedule`)**:
   - Clean, full-bleed, responsive page with dedicated URL wayfinding.
   - Clear visual hierarchy with zero background clutter.
   - Accessible directly from TopNav / Account Menu / Today without loading draft assets.
2. **Contextual Action Support**:
   - If an executive is in Today and clicks *"Adjust rhythm"*, open a focused, lightweight slide-over drawer that only touches schedule data, or cleanly navigate to `/schedule?from=today` with a prominent "← Back to Today" link.

---

## 3. Core ICP Reality & Mental Model (The Fatigued Founder)

### Who They Are
- **Profile**: B2B Founder, Managing Director, Agency CEO, Enterprise Consultant (e.g. Parvej Shah selling 24/7 AI voice agents to real estate brokerages).
- **Day-in-the-Life**: 10–14 hours of high-stakes firefighting — investor calls, sales pitches, client emergencies, team management, cash-flow decisions.
- **Mental Energy at Login**: **Near zero**. They open Minions at 9:30 PM on a phone or during a 3-minute gap between meetings.
- **Why They Purchased Minions**: *"I want consistent, authoritative LinkedIn presence that builds pipeline, without me having to become a creator or hire a \$6,000/mo ghostwriting agency."*
- **Their Worst Nightmare**: An app that feels like **another unpaid job** or a complex enterprise CMS (like Hootsuite or HubSpot) requiring manual calendar management.

### What They Want vs. What the Current Modal Gives Them

```mermaid
flowchart TD
    subgraph ICP Mental Model: "Effortless Authority"
        A["Executive Intent: 'Set my cadence and let Minions work.'"]
        A --> B["Pace: 3 posts/week (Mon/Wed/Fri at 9 AM)"]
        B --> C["Safety: 'Let me approve with 1 tap before it goes live'"]
        C --> D["Result: Done in 10 seconds. Minions delivers."]
    end

    subgraph Current UX: "The CMS Admin Chore"
        E["Executive arrives at /editorial?schedule=1"]
        E --> F["State Confusion: 'Automatic drafting Off' + warning alert"]
        F --> G["Choice Overload: Every day vs Every few days vs Set days"]
        G --> H["Fiddly UI: Native time spinners + Timezone Asia/Dhaka"]
        H --> I["Inverted Hazard: 'Publish without my review' in warning gold"]
        I --> J["Under-the-Hood Leak: 7 slots, BELOW_BAR badges, lane selectors, objectives"]
        J --> K["Reaction: Cognitive fatigue, hesitation, closes modal without saving."]
    end
```

---

## 4. Systematic Anti-Pattern Audit (Intent & Impeccable Heuristics)

### Anti-Pattern 1: The "Double-Negative / Inverted Hazard" Switch
- **Location**: `src/components/schedule/ScheduleSettings.tsx:291-309`
- **Observed Code**:
  ```tsx
  <p className="text-sm font-semibold text-ink">Publish without my review</p>
  <p className="mt-0.5 text-xs text-muted">
    {data.require_review 
      ? "Off: nothing goes live until you approve it." 
      : "On: scheduled drafts that pass checks go live; others wait for you."}
  </p>
  <button
    role="switch"
    aria-checked={!data.require_review}
    className={`... ${!data.require_review ? "bg-gold" : "bg-line"}`}
  />
  ```
- **Violations**: Intent Principle 1 (*Respect User Autonomy*), Category 1 (*Trick Questions / Confusing Phrasing*), Impeccable Craft Floor (*Theming & Token Discipline*).
- **The Friction**:
  1. The user must parse double negatives: "Turning ON 'Publish without my review' means turning OFF the review requirement."
  2. The switch turns **warning gold (`bg-gold`)** when active. In executive interfaces, amber/gold signifies a hazard or error state. The UI treats autonomous publishing like an active bomb threat rather than a high-value core product capability.
- **The Fix**:
  Replace with a high-clarity segmented control or radio card:
  - **"Publishing Mode"**:
    - **Review First (Default)**: *"You approve each draft with 1 tap before it posts."*
    - **Autopilot**: *"Posts that meet your quality bar go live automatically. Alerts you only if input is needed."*

---

### Anti-Pattern 2: The "Under-the-Hood Plumbing Leak" (Algorithmic Jargon)
- **Location**: `src/components/schedule/ContentPlanCard.tsx:47-52, 201-207, 229-234`
- **Observed Code**:
  ```tsx
  const METHOD_STYLE: Record<FillMethod, string> = {
    LANE: "bg-brand/10 text-brand border-brand/30",
    OTHER_LANE: "bg-brand/10 text-brand border-brand/30",
    TARGETED_HARVEST: "bg-brand/10 text-brand border-brand/30",
    BELOW_BAR: "bg-gold/10 text-gold border-gold/30",
  };
  ...
  {s.fill_method === "BELOW_BAR" && (
    <p className="text-[11px] text-gold flex items-start gap-1.5">
      Below the usual bar: {s.gate_reasons.join("; ")}. Its draft always waits for your review.
    </p>
  )}
  ```
- **Violations**: Intent Principle 3 (*Make Intent Visible*), Intent Principle 2 (*Design for Real Conditions*).
- **The Friction**:
  - The modal surfaces internal database and n8n orchestration terms: `LANE`, `OTHER_LANE`, `TARGETED_HARVEST`, `BELOW_BAR`.
  - Telling an executive that a future hypothetical draft is *"Below the usual bar: insufficient proof points"* creates dread and anxiety about an asset they haven't even seen yet.
  - Furthermore, each slot displays a dropdown allowing the user to override or pin the "Lane" (Authority, Credibility, Demand). A busy professional does not want to balance editorial weight matrices. That is why they hired an AI ghostwriter.
- **The Fix**:
  - Hide internal algorithm machinery. The user needs to know: **What is coming up**, **When**, and **What is the hook/topic**.
  - If an idea needs real-world founder input, state it in plain English on Today: *"Parvej, what was your biggest win with Follow Up Boss this week?"*

---

### Anti-Pattern 3: The "Split-Brain" Save Model
- **Location**: `ScheduleSettings.tsx:144-175, 312-324` vs `ContentPlanCard.tsx:94-100`
- **Observed Behavior**:
  1. In `ScheduleSettings`: Changes to cadence and time are held in local React state. An explicit **"Save schedule"** button sits at the bottom right. If unedited, it says "Saved" (disabled). If edited, it says "Save schedule" and shows "Not saved yet" in gray text.
  2. In `AutomaticDrafting`: If settings are changed, a prominent primary button **"Save & turn on"** appears at the top right.
  3. In `ContentPlanCard`: Changing an objective or pinning a lane triggers an **immediate background auto-save PATCH** with a toast notification.
- **Violations**: Intent Principle 1 (*Transparent Consequences*), Impeccable Dimension 5 (*Implementation Integrity*).
- **The Friction**:
  Three different persistence mental models coexist in one 768px sheet:
  - Top: "Save & turn on" (saves schedule + enables drafting).
  - Middle: "Save schedule" (explicit save, dirty state warning).
  - Bottom: Auto-saving dropdowns and inputs (silent background updates).
  If a user edits a time in the middle and then changes an objective at the bottom and closes the modal, **the time is lost while the objective is saved**.
- **The Fix**:
  Single unified persistence model. Either:
  - Instant auto-save with a calm, tactile "Saved ✓" indicator in the corner, OR
  - A fixed, sticky executive footer bar with one clear primary action: `Save & Apply`.

---

### Anti-Pattern 4: The Developer-Grade Time Spinner (`<input type="time">`)
- **Location**: `ScheduleSettings.tsx:268-275`
- **Observed Code**:
  ```tsx
  <input
    type="time"
    value={time}
    disabled={saving}
    className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink ..."
  />
  ```
- **Violations**: Impeccable Dimension 1 (*Accessibility & Touch Ergonomics*), Impeccable Dimension 4 (*Responsive Design*).
- **The Friction**:
  - Native `<input type="time">` yields vastly inconsistent, clunky browser UI (especially on Chromium/WebKit desktop), with tiny 14px spinbuttons and awkward keyboard tab sequences.
  - It exposes arbitrary minute increments (`09:17`, `14:43`). Executives schedule thought leadership into standard engagement windows:
    - **Morning commute / Coffee**: 08:30 – 09:30
    - **Lunch break**: 12:00 – 13:00
    - **Evening wind-down**: 18:00 – 19:30
- **The Fix**:
  Provide tactile, calibrated time presets (e.g. pills for `09:00 (Morning)`, `12:30 (Midday)`, `18:00 (Evening)`) with a custom time option for edge cases.

---

### Anti-Pattern 5: The "Every Few Days" Modulo Math Trap
- **Location**: `ScheduleSettings.tsx:40, 223-238`
- **Observed UI**:
  - `[Every day]` | `[Every few days]` | `[Set days]`
  - Clicking "Every few days" reveals: `every [ 3 ] days`.
- **The Friction**:
  - "Every 3 days" is mathematical, not circadian. If Monday is day 1, post 2 is Thursday, post 3 is Sunday, post 4 is Wednesday, post 5 is Saturday. It wanders across weekends and irregular business hours.
  - B2B executives do not think in modulo days. They think in calendar routines: *"Mon, Wed, Fri"* or *"Tuesday and Thursday"*.
- **The Fix**:
  Eliminate "Every few days". Replace with human cadence selections:
  - **3 days a week** (Mon, Wed, Fri) — *Recommended industry standard for LinkedIn authority.*
  - **Every weekday** (Mon–Fri) — *High-growth cadence.*
  - **Custom days** — *Tap any day of the week.*

---

## 5. Technical Audit Score (Impeccable Standards)

| # | Dimension | Score | Code Reference & Finding |
|---|-----------|-------|--------------------------|
| 1 | **Accessibility (A11y)** | **2/4** | `ScheduleSettings.tsx:300` & `AutomaticDrafting.tsx:147`. Inverted switch aria labels (`aria-checked={!data.require_review}`); native time input lacks accessible associated label elements; low-contrast text on subtle timezone strings (`text-subtle` at ~3.2:1 against surface). |
| 2 | **Performance** | **2.5/4** | Modal loads 3 separate un-batched API calls on mount (`/api/schedule`, `/api/plan`, `/api/plan/status`) on top of the already heavy `/editorial` assets query. |
| 3 | **Theming & Tokens** | **3/4** | Good Tailwind token compliance (`bg-surface`, `text-ink`, `border-line`), but misuses semantic warning token `bg-gold` for ordinary user preferences. |
| 4 | **Responsive Design** | **2/4** | On mobile viewports (390px), expanding accordions pushes the Save button out of the viewport; day-of-week buttons wrap into uneven two-row clusters; sheet modal scrolling conflicts with mobile browser pull-to-refresh. |
| 5 | **Implementation Integrity** | **2.5/4** | Mixed save contracts (manual vs auto-save); leakage of backend infrastructure state (`service_running` check-in); double negative state management. |
| **Total** | | **12/20** | **Acceptable (Requires Architecture Migration & UX Streamlining)** |

---

## 6. The Redesign Blueprint: "The Executive Pace Engine"

### High-Level Architecture: Move from Parasitic Modal to Dedicated Surface

```
Current Structure:
/editorial?schedule=1  ---> [Heavy Review Studio] + [Floating Sheet Modal]

Proposed Structure:
/schedule (or /brand?tab=schedule) ---> [Clean, Dedicated Executive Pace Engine]
                                   ↳ Back to Today (One-click return)
                                   ↳ Zero heavy review assets loaded
```

### Screen Layout Specification: 3 Clean Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back to Today                                                       │
│                                                                        │
│  Publishing Pace                                                       │
│  Set your rhythm once. Minions prepares and stages drafts while you work.│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. WEEKLY RHYTHM                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────┐ │
│  │ ● 3 times a week        │  │ Every weekday           │  │ Custom  │ │
│  │ Mon, Wed, Fri at 09:00  │  │ Mon–Fri at 09:00        │  │ Pick    │ │
│  │ Recommended for B2B     │  │ High growth             │  │ days    │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────┘ │
│                                                                        │
│  Posting time: [ 09:00 AM (Morning) ▾ ]  Timezone: Asia/Dhaka           │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  2. PUBLISHING CONTROL                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ (●) Review first (Recommended)                                    │ │
│  │     Drafts wait in Today for your 1-tap approval before going live.│ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │ ( ) Autopilot                                                     │ │
│  │     Drafts that pass all brand checks publish automatically.      │ │
│  │     Minions only alerts you if something needs personal attention.│ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  3. YOUR COMING WEEK (FORECAST)                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Mon 16 Nov · 09:00    Why CRM summaries are a consolation prize   │ │
│  │ Wed 18 Nov · 09:00    The 1.8-second rule for AI voice agents     │ │
│  │ Fri 20 Nov · 09:00    Follow Up Boss vs kvCORE speed-to-lead      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  [ Save rhythm ]  or  Auto-saved instantly                             │
└────────────────────────────────────────────────────────────────────────┘
```

### The 3 Core Pillars of the Redesign

#### Pillar 1: Cadence Presets Designed for Business Outcomes
- **"3 times a week" (Recommended)**: Mon, Wed, Fri. The proven sweet spot for LinkedIn algorithmic distribution without saturation.
- **"Every weekday"**: Mon–Fri. For aggressive campaign sprints.
- **"Custom"**: For users who have specific company posting days.

#### Pillar 2: Affirmative Autonomous Control
- Replace "Publish without my review" with **"Publishing Control"**.
- Default to **"Review first"**: Gives the user total psychological safety.
- Offer **"Autopilot"** as a high-trust upgrade, framing it as empowering automation rather than risky negligence.

#### Pillar 3: Executive Forecast vs. Algorithm Debugger
- Replace the raw slot-table with a clean, calm forecast list.
- Display the actual draft hook/title, scheduled date/time, and status in human terms:
  - *"Draft ready for your look"*
  - *"Drafting automatically on Monday"*
- Remove `BELOW_BAR`, `LANE`, and `TARGETED_HARVEST` badges entirely.

---

## 7. Migration & Implementation Strategy

### Step 1: Create Dedicated Page `/schedule` (Task 74)
- Create `src/app/(dashboard)/schedule/page.tsx`.
- Use standard dashboard layout with clean `PageHeader` ("Publishing pace", subtitle "Set your rhythm once...").
- Keep backward compatibility: redirect `/editorial?schedule=1` to `/schedule` or mount a clean redirect.
- Update `AccountMenu.tsx` ("Posting schedule") and `TodayView.tsx` ("Set a schedule") to link directly to `/schedule`.

### Step 2: Refactor `ScheduleSettings.tsx` into "ExecutivePace.tsx" (Task 75)
- Replace "Every few days" with the 3 curated rhythm presets.
- Replace "Publish without my review" with the affirmative binary "Review First" vs "Autopilot".
- Replace raw native time spinner with quick-time pills (`09:00`, `12:30`, `18:00`) + custom time.
- Unify save mechanism to single explicit action or seamless optimistic auto-save.

### Step 3: Streamline `ContentPlanCard.tsx` into a Calm Forecast (Task 76)
- Strip out technical jargon (`BELOW_BAR`, `LANE`, `TARGETED_HARVEST`, and n8n service warnings).
- Render an Apple-grade, tranquil forecast card showing the next 3–5 slots with actual post titles or scheduled times.

---

## 8. Summary of Heuristic Violations & Remediations

| Code / Element | Heuristic Violated | Severity | Remediation |
|---|---|---|---|
| `DraftScheduleModal.tsx:11` | Impeccable Craft Floor (Banned Modal for Settings) | **Critical** | Move to dedicated route `/schedule` with clean return navigation. |
| `ScheduleSettings.tsx:293` | Intent Category 1 & 2 (Inverted Logic / Double Negative) | **Critical** | Rename to affirmative "Review First" vs "Autopilot" selector. |
| `ScheduleSettings.tsx:305` | Impeccable Token Rule (Misused Warning Gold) | **Major** | Remove `bg-gold` switch; use standard brand toggle tokens. |
| `AutomaticDrafting.tsx:27` | Intent Principle 3 (Exposing Infrastructure Plumbing) | **Major** | Suppress backend n8n heartbeat warning from customer-facing UI. |
| `ContentPlanCard.tsx:205` | Intent Principle 3 (Algorithmic Jargon) | **Major** | Remove `BELOW_BAR` & `LANE` badges; display plain-English forecast. |
| `ScheduleSettings.tsx:268` | Impeccable Dimension 1 & 4 (Native Time Input Clutter) | **Minor** | Provide calibrated time pills (`09:00`, `12:30`, `18:00`) + custom. |
