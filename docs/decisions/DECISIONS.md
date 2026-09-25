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
