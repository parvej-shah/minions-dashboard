# Post Studio Dictation & Cursor Interaction Evaluation

## Evaluated Proposals

1. **Caret-anchored insertion**: Spoken text inserts at the current text cursor (`selectionStart`/`selectionEnd`) instead of appending to the end of the post.
2. **Cursor-following microphone**: The dictation control button follows the text cursor across lines so it is immediately accessible without scrolling.

---

## Verdict & Principles Summary

| Proposal | Assessment | Core Principle | Recommendation |
|----------|------------|----------------|----------------|
| **Insert at Cursor** | Approved (Defect Fix) | User Autonomy & Predictability | Implement immediately. Replace selection / insert at caret. |
| **Cursor-Following Mic** | Rejected (Anti-Pattern Risk) | Fitts's Law & Visual Clarity | Reject. Use sticky viewport anchoring or persistent toolbar instead. |

---

## Detailed Evaluation

### 1. Voice Insertion at Cursor (`selectionStart` / `selectionEnd`)

#### Current State
In `src/lib/dictation.ts` (`joinDictation`) and `src/hooks/useDictation.ts`:
- Incoming speech recognition results are appended to the absolute end of the input string (`base + " " + said`).
- In multi-paragraph drafts (e.g. 300–600 word LinkedIn thought-leadership essays), placing the cursor in paragraph 2 to rephrase a sentence and activating dictation appends the spoken phrase to paragraph 5. The user must manually cut, scroll, and paste the phrase.

#### UX Impact
- **Predictability**: The text cursor is the universal standard for "where my next input appears." Appending to the bottom violates user expectation and forces corrective clipboard gymnastics.
- **Task Success**: Supporting caret insertion reduces micro-edit cycle time from ~20 seconds (dictate, find bottom, select, cut, scroll up, paste) to 2 seconds (place cursor, speak, stop).

#### Interaction Specification
- On mic activation, record `anchorStart = field.selectionStart` and `anchorEnd = field.selectionEnd`.
- If text is highlighted, incoming speech replaces the highlighted range.
- Interim speech replaces the active interim span: `[anchorStart, anchorStart + interimText.length]`.
- On final phrase recognition, commit text, advance cursor to `anchorStart + finalText.length`, and update `anchorStart` for subsequent phrases.

---

### 2. Cursor-Following Microphone Button

#### The Underlying User Problem
- In `src/components/ui/GlobalDictation.tsx` and `src/lib/dictation.ts` (`micPlacement`), the microphone is placed at the bottom-right of the textarea element: `top = rect.top + rect.height - size - inset`.
- In drafts exceeding the visible height of the editor, the button rests at the bottom edge. When editing early sections of a long draft, the user must scroll to the bottom of the card to find the mic button.
- In addition, the existing pinned button physically occludes text in the bottom right corner (as seen in the screenshot where the final line is partially blocked by the stop and waveform buttons).

#### Failure Modes of Traveling with the Cursor
1. **Text Occlusion**: The idle mic button is 36px wide; when active, it expands into a Stop button, waveform visualizer, and animated halo (~82px wide). Attaching this cluster to the cursor directly covers the next words or the line below, blinding the user to what they are reading.
2. **Moving Target & Fitts's Law**: As words are recognized, text is inserted dynamically and lines wrap. A cursor-following button moves continuously across the screen. Clicking "Stop" requires chasing a moving target.
3. **Click Interception & Native UI Collisions**: A floating interactive element next to the caret intercepts mouse clicks intended to reposition the cursor. On mobile and tablet viewports, it collides with native OS text selection menus (Copy / Paste / Look Up).
4. **Technical Drift**: HTML `<textarea>` elements do not expose native coordinate APIs for the caret. Simulating caret position via hidden mirror DIVs drifts with font rendering, line-height, text wrap, and scroll offsets.

---

## Recommended Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Post Editor Header               [ ⌨ Alt+D ] [ 🎙️ Mic ] │  <- Fixed, predictable location
├──────────────────────────────────────────────────────────┤
│ Paragraph 1: Problem statement...                        │
│                                                          │
│ Paragraph 2: If your team is losing weekend hours to     │
│ unvetted inquiries, I'd look first at [ | ]              │  <- Clean caret (zero occlusion)
│ what happens between greeting and the calendar offer...  │
│                                                          │
│ Paragraph 3: Deeper analysis...                          │
└──────────────────────────────────────────────────────────┘
```

### Pattern 1: Sticky Editor Header / Visible Corner Pin
- **Placement**: Anchor the dictation toggle to the top-right corner of the editor card or its toolbar.
- **Behavior**: Stays permanently in view, pinned to the editor chrome regardless of scroll depth.
- **Benefits**: Fixed target (Fitts's Law), zero occlusion of editorial copy, always accessible without scrolling.

### Pattern 2: Global Keyboard Shortcut
- Register `Alt + D` (or `Cmd/Ctrl + Shift + D`) when focused in any editable text field.
- Allows immediate voice activation and deactivation without moving the mouse away from the active line.

---

## Open Questions

1. **Toolbar Integration vs. Viewport-Clamped Floating Button**: Should the mic move into the editor card header (`SocialVariantTabs` / post header), or should `GlobalDictation` clamp its floating position to the visible viewport slice of the active textarea?
2. **Auto-Spacing**: When inserting speech at caret inside existing text, should the editor automatically ensure a leading space before and trailing space after if surrounding characters are alphanumeric?
