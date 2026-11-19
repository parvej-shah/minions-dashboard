# Cover template contract (v1 draft)

Research and contract for "bring your own cover design": a user pastes one
HTML file, we check it, and from then on their posts are drawn on it. Saved
per workspace, never shared with other workspaces.

Status: DECIDED 2026-11-19 (workspace-owned, Satori subset, carousel page 1, built-ins stay with an opt-out) and BUILT in tasks 91-95. `src/lib/covers/custom/contract.ts` is the authority; where this draft differs, the code wins. Differences: no `logo` slot; `{{emphasis}}` is not placed in markup, the headline element's `data-emphasis-color` highlights it; unknown fonts are refused (not fallback); every text slot sits alone in a `data-fit` element (min size 48 headline, 30 other); contrast must be >= 4.5:1; rotation never puts two custom covers in a row; the switch lives in brand visualAssets `cover_custom_only`; the SQL migration is written but not applied.

## 1. What the research found

**Our renderer is Satori, not a browser.** Covers are drawn by `satori`
(pinned 0.25.0, the version `next/og` bundles) and `sharp`, with text fitted
by our own font metrics (`src/lib/covers/fit.ts`). There is no headless
Chromium in the repo. That decides the contract:

| Satori supports | Satori does not |
|---|---|
| Flexbox layout (`display: flex` only, plus `contents`/`none`) | `display: grid`, floats, tables |
| `position: relative/absolute`, margin, padding, gap, `%`/px sizes | `calc()`, `z-index` (later elements paint on top) |
| `linear/radial-gradient`, `background-image: url()`, `mask`, `filter`, 2D `transform`, `box-shadow`, `border-radius` | 3D transforms, `<style>` tags, `<link>`, `<script>`, classes |
| CSS variables `var(--x)` with fallbacks, inline `<svg>`, `<img>` | RTL text, ligatures/kerning, `<input>` etc. |
| TTF / OTF / WOFF fonts | WOFF2 |

So "paste any HTML" cannot be literally true. The honest promise is: **paste
HTML written in the Satori subset, with our slots**. Anything a designer makes
in Figma/Canva/Claude can be written to this; we give them an AI-ready prompt
(section 6) so they never hand-code it.

**Why not a real browser.** Rendering arbitrary HTML needs headless Chromium
(~50 MB on Vercel, 1-3 s per render, cold starts) and makes every upload an
attack surface (scripts, SSRF through `<img src>`/`url()`, `file://`). The
layout-picker tiles render in 15-38 ms as Satori SVG (task 58); a browser path
would lose that. Rejected for v1. Revisit only if users cannot live in the
subset.

**What the current engine already gives a template for free:**
`CoverSpec` (`src/lib/covers/layouts.tsx:62`) is the data every design gets
today: label, headline, emphasis word, kicker, quote, number, author, brand
colours (contrast-checked by `coverBrand`), photo/cut-out, list/grid/punch.
The contract is a stable, named subset of that, so a custom template sits
beside the built-in designs and every downstream feature (layout picker,
carousel page 1, re-render on edit) keeps working.

## 2. The contract

A template is **one pasted HTML snippet**. Rules a user can read in 30 seconds:

1. **One root element** carrying the template's identity:
   `<div data-cover-template="1" data-name="Soft Blue" style="width:1080px;height:1350px;display:flex;...">`
   The size is fixed at **1080 x 1350** (4:5, the same as every cover and
   carousel slide today). Other sizes are out of scope for v1.
2. **Inline `style=""` only.** No `<style>`, no classes, no `<script>`, no
   `<link>`. Every container uses `display:flex` (Satori's only layout).
3. **Data goes in with `{{slot}}`.** Text slots go inside an element's text;
   image slots go in `<img src="{{slot}}">`. Nothing else is substituted.
4. **Colours come from variables:** `var(--ink)`, `var(--paper)`,
   `var(--accent)`, `var(--secondary)`. We fill them from the workspace's
   cover colours after our contrast check, so a template re-colours with the
   brand and stays readable. Hard-coded hex values are allowed for decoration.
5. **Fonts are ours:** `font-family` is one of `Bricolage Grotesque`,
   `Plus Jakarta Sans`, `Instrument Serif`. Anything else falls back to
   Plus Jakarta Sans and the check says so. (Custom font upload is v2.)
6. **No outside files.** Images are only `{{slots}}` or small inline `data:`
   images. Any `http(s)://` URL is refused.

### 2.1 Slots

| Slot | Kind | Required | Meaning |
|---|---|---|---|
| `{{headline}}` | text | **yes** | The post's cover line. Must sit in one element with `data-fit`. |
| `{{author_name}}` | text | **yes** | From the workspace brand. |
| `{{emphasis}}` | word | no | The one headline word to highlight (see 2.3). |
| `{{label}}` | text | no | "For real estate teams". |
| `{{kicker}}` | text | no | One supporting line. |
| `{{quote}}` | text | no | A sentence word for word from the post. |
| `{{number_value}}`, `{{number_unit}}` | text | no | A verified figure. |
| `{{author_role}}` | text | no | Byline role. |
| `{{list_1}}` ... `{{list_4}}` | text | no | The post's points. |
| `{{photo}}` | image | no | Author headshot (square-cropped). |
| `{{cutout}}` | image | no | Transparent cut-out of the author. |
| `{{logo}}` | image | no | Workspace logo. |

Only **two** slots are mandatory: `headline` and `author_name`. Every optional
slot the template does not use is simply never drawn; every optional slot it
does use must have a **fallback**: wrap the element in `data-if="slot"` and it
is removed when that slot is empty. Without `data-if`, an empty optional slot
fails the check (an empty gap on a finished cover is a bug).

### 2.2 Text fitting

Satori cannot detect overflow; our metrics can. Any element holding a text
slot declares its box:

`<div data-fit data-max-lines="3" data-min-size="48" data-max-size="96" style="font-size:96px; ...">{{headline}}</div>`

The renderer shrinks from `data-max-size` toward `data-min-size` until the text
fits `data-max-lines` in the element's width. If it cannot, the cover is refused
the same way built-ins are (`CoverFitError`, then the existing loose-headline
retry). Rules: `headline` must have `data-fit` and `data-min-size >= 40` (a
phone feed shows the cover at a third of its size).

### 2.3 Emphasis word

`{{headline}}` expands into word-level `<span>`s. The emphasis word gets the
style given on the headline element: `data-emphasis-color="accent"` and
optionally `data-emphasis-font="Instrument Serif"`. No emphasis word means no
accent, never a random one.

### 2.4 Safety allow-list (enforced on upload, not trusted)

- Tags: `div span p h1 h2 h3 img svg g path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop`.
- Attributes: `style`, `src` (slot or `data:image/png|jpeg|webp|svg+xml`), `alt`,
  `width`, `height`, `data-*` from the list above, SVG presentation attributes.
- Refused: `on*` handlers, `javascript:`, any URL scheme but `data:`, `url(http...)`,
  `@import`, `expression(`.
- Limits: 200 KB source, 400 nodes, 500 KB total inline images.
- Rendering never fetches the network for a template (no SSRF path).

## 3. The check ("is my template good?")

On paste, before saving, the server runs it with three fixed sample posts and
reports in plain words, one line per problem, with the element named:

1. **Parses** and passes the allow-list.
2. **Has the two mandatory slots** and `headline` has `data-fit`.
3. **Renders** with a short headline, the longest allowed headline, and a
   post with every optional slot empty. No `CoverFitError`, no empty gaps.
4. **Contrast:** headline colour vs the colour behind it >= 4.5:1 on the
   brand's colours and on two other themes (reuses `coverBrand`/`contrast`).
5. **Phone read:** headline at feed size (one third) is >= 24 px.

Pass shows the three renders as a preview and a **Save** button. Fail shows
only the errors. No score, no partial credit (core value: one headline, one
line, one action).

## 4. Saved per workspace

The user said "per user, not for all users". Brand, colours, ideas and posts
are all keyed by `client_id` (workspace) here, and one login can belong to
several workspaces, so the owner is the **workspace** and `created_by` records
the login. **Decision needed**: confirm workspace, not login (section 7).

New table `cover_templates` (SQL migration in `prisma/sql`, applied only with
the owner's OK):

| Column | Notes |
|---|---|
| `id`, `client_id` (FK, cascade) | owner workspace; every query filters by it |
| `name`, `version` (int) | version bumps on every edit |
| `source_html` | exactly what the user pasted |
| `manifest` (json) | slots used, fit boxes, found by the check |
| `status` | `ACTIVE` / `ARCHIVED` |
| `thumb_url` | the check's first preview, stored in R2 |
| `created_by`, `created_at` | audit |

A post stores `coverSpec.layout = "CUSTOM"`, `template_id`, `template_version`,
plus the slot values, and the render reads that exact version (a snapshot per
version), so later edits never change a post already approved. Deleting a
template archives it; posts using it still re-render. Limit 10 active
templates per workspace.

Use in the rotation: a workspace's active templates join the layout picker
(tiles via the existing tile route, cached per text version) and the
rotation in `posterType.ts`. A workspace switch **"Use only my designs"**
takes built-ins out of the rotation. Carousel page 1 uses the template too
(`postCoverSpec`), pages 2+ stay built-in (v1).

## 5. Where it plugs in (for the build)

- `src/lib/covers/custom/` (new): `parse.ts` (HTML to Satori element tree,
  allow-list, slot fill), `check.ts`, `contract.ts` (slot table above as the
  single source for code, docs and the AI prompt).
- `layouts.tsx`: `CoverLayout` gains `"CUSTOM"`; `coverElement` delegates.
- `render.ts`: unchanged; it already takes a `CoverSpec`.
- Brand page: a "Your designs" card (paste, check, preview, save, archive).
- API: `POST /api/cover-templates/check`, `POST/GET/DELETE /api/cover-templates`,
  all behind workspace auth, rate-limited.
- Decisions: `docs/decisions/DECISIONS.md` entry once the owner confirms.

HTML parser: none is installed (`satori-html` is not a dependency). Use
`parse5` (small, pure JS, spec-compliant) to build the tree; it runs on the
server only.

## 6. The paste-ready prompt (what we show users)

> Design a social cover as one HTML snippet, 1080x1350px, for Satori (a CSS
> subset: flexbox only, inline styles only, no grid/calc/z-index/classes).
> Root: `<div data-cover-template="1" data-name="...">`. Use these slots where
> they fit: `{{headline}}` (required, inside an element with `data-fit
> data-max-lines data-min-size data-max-size`), `{{author_name}}` (required),
> optional `{{emphasis}} {{label}} {{kicker}} {{quote}} {{number_value}}
> {{author_role}} {{list_1}}..{{list_4}} {{photo}} {{cutout}} {{logo}}`
> (wrap optional ones in `data-if="slot"`). Colours only via `var(--ink)
> var(--paper) var(--accent) var(--secondary)`. Fonts: Bricolage Grotesque,
> Plus Jakarta Sans, Instrument Serif. No scripts, no external URLs.

The same text is generated from `contract.ts`, so the prompt can never drift
from what the check enforces.

## 7. Open decisions (owner)

1. **Owner of a template:** workspace (recommended) or individual login?
2. **Engine:** Satori subset (recommended, fast, safe) or real browser (full HTML, slow, riskier)?
3. **Carousel:** custom template for page 1 only in v1 (recommended), or all pages?
4. **Built-ins:** keep in rotation by default with an opt-out switch (recommended)?

## 8. Build plan (small tasks, tests first)

| Task | Goal |
|---|---|
| 91 | `contract.ts` + `parse.ts` + allow-list, with unit tests (rejects script/URL/grid, fills slots) |
| 92 | `check.ts`: three sample renders, fit, contrast, plain-word errors |
| 93 | `cover_templates` table, service, API (workspace-scoped, rate-limited) |
| 94 | Render path: `CUSTOM` layout, versioned snapshot on the post, picker tiles, carousel page 1 |
| 95 | Brand page "Your designs" card + paste-ready prompt + docs + decision log |
