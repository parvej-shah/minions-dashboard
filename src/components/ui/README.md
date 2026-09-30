# Minions UI kit

The bar is a lesson app (Duolingo): one obvious next action per screen,
buttons you can feel, instant feedback, and nothing that flashes while it
loads. Build new screens from these pieces rather than raw hex and one-off
classes.

## Tokens (`src/app/globals.css` → `@theme`)

Every token is a Tailwind utility (`bg-brand`, `text-muted`, `border-line`,
`border-b-brand-edge`).

| Token | Use |
|---|---|
| `canvas` / `surface` / `surface-2` / `surface-3` | page, card, raised, hover on raised |
| `line` / `line-strong` | borders |
| `ink` / `muted` / `subtle` | primary, secondary, tertiary text |
| `brand` (+ `-hover`, `-edge`, `-ink`) | the one action colour |
| `coral` | needs attention (drafts waiting) |
| `gold` | streaks and rewards |
| `danger` | destructive actions and errors |

Animations: `animate-shimmer` (skeletons), `animate-pop-in` (a thing
arriving), `animate-rise-in` (content entering). All stop under
reduced motion.

## Components

- **`Button` / `ButtonLink` / `buttonStyles()`**: the tactile button. The
  variants are `primary`, `soft` (brand-tinted, for real actions that should
  not compete with the primary), `secondary`, `light` (third-party sign-in), `ghost`,
  `gold`, `coral` and `danger`, in sizes `sm`, `md` and `lg`. `block` makes it
  full width. `shout` uppercases the label, for one-word lesson actions such as
  CONTINUE. `loading` keeps the button's width, shows a spinner and blocks
  double clicks.
  Put at most one `primary` on each screen.
- **`Card` / `cardStyles()`**: the tones are `default`, `raised` (it has the
  button's bottom edge, for tappable cards), `brand`, `coral` and `gold`.
- **`Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonGroup`,
  `PageSkeleton`**: placeholders shaped like the content that is on its way.
  Wrap a group in `SkeletonGroup` so screen readers hear a single "Loading".
- **`segment`** (`segment.ts`): classes for segmented tabs such as
  Queue | Stream | Calendar. Use `${segment.on}` for the chosen tab and
  `${segment.off}` for the rest.
- **`LoadingState`** (in `EmptyState.tsx`): skeleton rows with one loading
  announcement. Use it wherever a list is still fetching.
- **`ProgressBar`**: a thick, rounded bar for steps and goals. The value runs
  from 0 to 1.
- **`EmptyState`**, **`Modal`**, **`ConfirmModal`**, **`Toast`** and
  **`StatusBadge`** already existed and are still the ones to use.

## Rules

1. **Never flash the wrong screen.** Decide on the server where someone
   belongs, and redirect before anything renders. `src/lib/homeRoute.ts` does
   this for sign-in and `/onboarding`. Client-side checks are only a fallback,
   and they show a skeleton while they run.
2. **Loading shows the page's shape, not a spinner.** Give each route group a
   `loading.tsx` that uses `PageSkeleton`. Inside a page, show skeletons where
   the numbers will go. Don't show `0` and then jump.
3. **One next step.** Every screen has one primary action. Anything else is
   secondary or ghost.
4. **Feedback on every press.** Buttons sink when pressed, and async buttons
   use `loading`.
