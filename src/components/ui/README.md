# Minions UI kit

The bar is Apple.com: light grounds, big plain type, one blue action per
screen, soft cards with no borders, and nothing that flashes while it loads.
Busy people should feel calm, not rushed. Build new screens from these
pieces rather than raw hex and one-off classes.

## Tokens (`src/app/globals.css` → `@theme`)

Every token is a Tailwind utility (`bg-brand`, `text-muted`, `border-line`,
`shadow-soft`).

| Token | Use |
|---|---|
| `canvas` / `surface` / `surface-2` / `surface-3` | page, card, well or weekend tile, hover on well |
| `line` / `line-strong` | hairlines and input borders |
| `ink` / `muted` / `subtle` | primary, secondary, tertiary text |
| `brand` (+ `-hover`, `-ink`) | the one action colour (#0066CC) |
| `coral` | needs you (posts waiting) |
| `gold` | caution |
| `danger` | destructive actions and errors |
| `success` | scheduled, done |
| `shadow-soft` | cards |
| `shadow-float` | things over the page: menus, toasts, drawers, modals |

Type: page titles 40–56px semibold, card titles 28–32px semibold, body
17px. No mono, no uppercase labels, no extra-bold.

Animations: `animate-shimmer` (skeletons), `animate-pop-in` and
`story-pop` (a gentle fade-and-settle, no bounce), `animate-rise-in`
(content entering), `animate-[indeterminate_…]` (working bars). All stop
under reduced motion. No confetti, streaks or 3D edges.

## Components

- **`Button` / `buttonStyles()`**: the pill button (use `buttonStyles()` on a
  `<Link>`). Variants `primary` (filled blue), `soft` (blue outline),
  `secondary` (grey outline), `light` (third-party sign-in), `ghost` (blue
  text), `danger`; `gold` and `coral` map onto the calm ones for old callers.
  Sizes `sm`, `md`, `lg`; `block` is full width; `loading` keeps the width,
  shows a spinner and blocks double clicks. At most one `primary` per screen.
- **`Card` / `cardClass()`**: `rounded-[28px]`, white, `shadow-soft`, no
  border. Tones `default`, `well` (grey, for empty states), `brand`, `coral`,
  `gold`; padding `none`, `md`, `lg` (hero cards).
- **`Text.tsx`**: `PageHeader` (kicker line + big title + optional `action`
  on the right), `SectionHeader` (title + "All posts ›" link), `CardTitle`
  and `StatusLabel` ("● Needs you" in coral/success/muted/brand). Use these
  instead of copying type sizes.
- **`Filters.tsx`**: `Segmented` (the grey pill control: Up next · Written ·
  Set aside) and `SearchField` (rounded search with a clear button).
- **`Menu`**: the ⋯ menu. Closes on outside click and Escape; arrow keys move
  between items.
- **`segment`** (`segment.ts`): raw classes behind `Segmented`, for tabs that
  are links.
- **`Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonGroup`,
  `PageSkeleton`**: placeholders shaped like the content on its way. Wrap a
  group in `SkeletonGroup` so screen readers hear a single "Loading".
- **`LoadingState`** (in `EmptyState.tsx`): skeleton rows with one loading
  announcement.
- **`ProgressBar`**: a thin rounded bar; value 0 to 1.
- **`Modal`** (`center` and `sheet`), **`Drawer`**, **`ConfirmModal`**,
  **`Toast`**, **`EmptyState`**, **`ErrorLine`**.
- **`fieldStyles`**: `inputClass`, `sectionClass` and `sectionCardClass` for
  settings forms.
- **`PostThumb`** (`components/posts`): a post cover that always stays inside
  its box (4:5, `min-w-0`, absolute image). Use it wherever a cover sits in a
  flex or grid row.

## Rules

1. **Never flash the wrong screen.** Decide on the server where someone
   belongs and redirect before anything renders (`src/lib/homeRoute.ts`).
2. **Loading shows the page's shape, not a spinner.** Each route group has a
   `loading.tsx` using `PageSkeleton`; inside a page, skeletons sit where the
   numbers will go.
3. **One next step.** One primary per screen; everything else is soft,
   secondary or ghost.
4. **Nothing spills.** Flex children that hold images or long text get
   `min-w-0`; rows that can run out of room use `flex-wrap`. Check every
   screen at 390px wide.
