# Decision log

Every decision made during development — product, architectural, or
technical — that isn't obvious from reading the code goes here, in order,
never edited or deleted after the fact. If a later decision reverses an
earlier one, add a new entry and mark the old one superseded; don't rewrite
history.

This file is append-only. Product-strategy decisions that belong to the
authority flywheel roadmap keep living in their own D-table in
[authority-flywheel-plan.md](../product/authority-flywheel-plan.md) — link to
the relevant Dn from here rather than duplicating it. Everything else
(architecture, library choices, schema shape, trade-offs, things rejected
and why) goes here.

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

## 2026-09-25 — Establish this decision log

**Decision:** Every non-obvious development decision must be recorded here
as it's made, not reconstructed later from git history or memory.
**Why:** AI-driven development produces many small irreversible-in-practice
choices (schema shape, library picks, trade-offs) across sessions and
agents; without a running log, later sessions re-litigate settled questions
or silently drift from them.
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
